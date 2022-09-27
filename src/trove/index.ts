import {
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import {Web3Service} from '../web3Service'
import {Buffer} from "buffer";
import {BaseRateRecordModel, TroveModel} from "./models";
import {
    BASE_RATE_ACCOUNT, BASE_RATE_DECAY_PER_WEEK,
    COLLATERAL_DECIMAL, COLLATERAL_RATIO_DECIMAL,
    DECIMALS,
    DEPT_DECIMAL,
    LIQUIDATION_RESERVE_DECIMAL,
    MINIMUM_COLLATERAL_RATIO,
    MINIMUM_TOTAL_DEPT,
    MINT_KEY, PRECISION, RECOVERY_MODE_ACCOUNT, REDEMPTION_FEE_ADDON,
    SOLANA_PRICE_ACCOUNT_DEVNET,
    STABILITY_POOL_PROGRAM_KEY, STABILITY_POOL_PROGRAM_PDA_KEY,
    STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY,
    STABILITY_POOL_RECORD_ACCOUNT,
    TOTAL_DEPT_DECIMAL,
    TROVE_PROGRAM_KEY,
    TROVE_PROGRAM_PDA_KEY,
    TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY,
    TROVE_RECORD_ACCOUNT
} from "../config";
import {getAccount, TOKEN_PROGRAM_ID, getMint} from "@solana/spl-token";
import {getOrCreateTokenAccount, getSolanaPriceInUSD, getTokenPriceInUSD, signAndSendTransaction} from "../utils";
import {encode} from "bs58"
import {
    OPEN_OFFSET,
    OWNER_OFFSET, REDEMPTION_INSTRUCTION,
    TROVE_CLOSE_INSTRUCTION,
    TROVE_CREATE_INSTRUCTION,
    TROVE_LIQUIDATE_INSTRUCTION,
    TROVE_OPEN,
    TROVE_UPDATE_INSTRUCTION
} from "./constants";
import {StabilityPool} from '../stabilityPool';
import assert from "assert";
import {bool} from "@solana/buffer-layout-utils";

export class Trove extends Web3Service {

    getTokenSupply = async ()=>{
        let mint=await getMint(this.connection,MINT_KEY)
        return (parseInt(mint.supply.toString())/DECIMALS).toFixed(PRECISION)
    }
    getMiminumCollateralRatioForBorrowing = async ()=>{
        let recovery_mode=await this.getRecoveryMode()
        if(recovery_mode){
            return 150
        }
        return 110
    }
    getRecoveryMode = async ()=>{
        let recovery_acc = await this.connection.getAccountInfo(RECOVERY_MODE_ACCOUNT)
        return Boolean(recovery_acc.data[0])
    }
    getRedemptionFee = async()=>{
        return REDEMPTION_FEE_ADDON+ await this.getBaseRate()
    }
    getBorrowFee = async()=>{
        let is_recovery = await this.getRecoveryMode();
        let fee = REDEMPTION_FEE_ADDON+ await this.getBaseRate()
        fee = Math.min(fee,5);
        fee = Math.max(fee,0);
        return is_recovery? 0 : fee
    }
    applyTimeDecay = async (rate, time) => {
        let current_time =  Math.floor(Date.now() / 1000);
        let weeks = ((current_time-time )  / 604800);
        let new_rate = rate - weeks*(BASE_RATE_DECAY_PER_WEEK * rate);
        if (new_rate < 0 ){
            new_rate = 0;
        }
        return new_rate;

    }
    getBaseRate = async () => {
        let base_rate_account =await this.connection.getAccountInfo(BASE_RATE_ACCOUNT);
        let {base_rate:rate ,timestamp:time } = BaseRateRecordModel.decode(base_rate_account.data);
        let base_rate = parseInt(rate.toString())/DECIMALS
        let timestamp = parseInt(time.toString())
        return this.applyTimeDecay(base_rate,timestamp);
    }
    getTrove = async (clientKey: PublicKey) => {
        const filters = [
            {memcmp: {offset: OWNER_OFFSET, bytes: clientKey.toBase58()}},
            {memcmp: {offset: OPEN_OFFSET, bytes: encode(TROVE_OPEN)}},
        ];
        return this.#getTroveDataAccountInfo(clientKey, filters);
    }
    getAllTrove = async () => {
        const filters = [
            {memcmp: {offset: OPEN_OFFSET, bytes: encode(TROVE_OPEN)}},
        ];
        const solanaPrice = await getSolanaPriceInUSD();
        const tokenPrice = await getTokenPriceInUSD();
        const accounts = await this.connection.getProgramAccounts(TROVE_PROGRAM_KEY, {filters});
        let troves = accounts.map((account) => this.#serializeTroveData(account.pubkey, account.account.data, solanaPrice, tokenPrice))
        return troves.sort((trove1, trove2) => trove1.collateralRatio - trove2.collateralRatio)
    }

    getTroveConfig = async () => {
        // store data in account and get data from account
        // update account data when necessary
        return {
            liquidationReserve: 1,
            borrowingFeePercent: 0.5,
        };
    }

    #getAllTrovesCreator = async () => {
        const filters = [
            {memcmp: {offset: OPEN_OFFSET, bytes: encode(TROVE_OPEN)}},
        ];
        const accounts = await this.connection.getProgramAccounts(TROVE_PROGRAM_KEY, {filters});
        const solanaPrice = await getSolanaPriceInUSD();
        const tokenPrice = await getTokenPriceInUSD();
        return accounts.map((account) => ({
            ...this.#serializeTroveData(account.pubkey, account.account.data, solanaPrice, tokenPrice),
            accountPubkey: account.pubkey,
            ownerPubkey: this.#serializeTroveData(account.pubkey, account.account.data, solanaPrice, tokenPrice).owner
        }));
    }

    createOrUpdateTrove = async (clientKey: PublicKey, collateral: number, dept: number) => {

        if (collateral <= 0) {
            throw new Error("Collateral must be greater than 0");
        }
        if (dept <= 0) {
            throw new Error("Dept must be greater than 0");
        }

        const filters = [
            {memcmp: {offset: OWNER_OFFSET, bytes: clientKey.toBase58()}},
            {memcmp: {offset: OPEN_OFFSET, bytes: encode(TROVE_OPEN)}},
        ];
        const troveDataAccountInfo = await this.#getTroveDataAccountInfo(clientKey, filters);
        const troveConfig = await this.getTroveConfig();
        let totalDept: number;
        if (troveDataAccountInfo) {
            if (troveDataAccountInfo.owner.toBase58() !== clientKey.toBase58()) {
                throw new Error("You are not the owner of the Trove account, you are trying to update\"");
            }
            if (troveDataAccountInfo.dept === dept && troveDataAccountInfo.collateral === collateral) {
                throw new Error("Collateral and Dept are unchanged");
            }
            if (dept > troveDataAccountInfo.dept) {
                const deptDiff = dept - troveDataAccountInfo.dept
                totalDept = troveDataAccountInfo.totalDept + ((troveConfig.borrowingFeePercent * deptDiff) / 100) + deptDiff;
            } else {
                totalDept = troveDataAccountInfo.totalDept - (troveDataAccountInfo.dept - dept)
            }
        } else {
            totalDept = troveConfig.liquidationReserve + ((troveConfig.borrowingFeePercent * dept) / 100) + dept;
        }
        if (totalDept < MINIMUM_TOTAL_DEPT) {
            throw new Error('Total Dept is less than Minimum Total Dept of ' + MINIMUM_TOTAL_DEPT);
        }

        const solanaPrice = await getSolanaPriceInUSD();
        let allTroves= await this.getAllTrove();
        let tcr = this.calculate_tcr(allTroves.filter(x=>x.owner.toBase58()!=clientKey.toBase58()),solanaPrice)
        if ((((tcr.tcr_collateral + (collateral*solanaPrice)) / (tcr.tcr_borrow + totalDept)))*100 < 150) {
            throw new Error("Trove collateral ratio is insufficient, It shouldnt cause TCR below 150");
        }
        const tokenPrice = await getTokenPriceInUSD();
        const collateral_ratio_percent = ((collateral * solanaPrice) / (totalDept * tokenPrice)) * 100;
        if (collateral_ratio_percent < MINIMUM_COLLATERAL_RATIO) {
            throw new Error('Collateral Ratio is less than Minimum Collateral Ratio of ' + MINIMUM_COLLATERAL_RATIO);
        }

        if (troveDataAccountInfo) {
            return await this.#updateTrove(clientKey, collateral, dept, troveDataAccountInfo.dataAccountPublicKey);
        } else {
            return await this.#createTrove(clientKey, collateral, dept);
        }
    }

    liquidateTrove = async (clientKey: PublicKey, troveDataAccountKey: PublicKey) => {
        const account = await this.connection.getAccountInfo(troveDataAccountKey);
        const solanaPrice = await getSolanaPriceInUSD();
        const tokenPrice = await getTokenPriceInUSD();
        const troveDataAccountInfo = this.#serializeTroveData(account.owner, account.data, solanaPrice, tokenPrice);
        const collateral_ratio_percent = ((troveDataAccountInfo.collateral * solanaPrice) / (troveDataAccountInfo.totalDept * tokenPrice)) * 100;
        // if (collateral_ratio_percent > MINIMUM_COLLATERAL_RATIO) {
        //     throw new Error("Cannot liquidate a trove with a Collateral Ratio greater than " + MINIMUM_COLLATERAL_RATIO + "%");
        // }
        const clientTokenAccountKey = await getOrCreateTokenAccount(this.connection, this.provider, clientKey);
        const totalTokensInStabilityPool = Number((await this.connection.getTokenAccountBalance(STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY)).value.uiAmountString);
        let pools = [];
        if (totalTokensInStabilityPool > 0) {
            pools = await new StabilityPool(this.connection, this.provider).getAllStabilityPoolProviders();
        }
        let troves = [];
        if (totalTokensInStabilityPool < troveDataAccountInfo.totalDept) {
            troves = await this.#getAllTrovesCreator();
        }
        const instruction = await this.#troveLiquidateInstruction(clientKey, clientTokenAccountKey, troveDataAccountKey, pools, troves)
        const transaction = new Transaction().add(instruction);
        transaction.feePayer = clientKey;
        let hash = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = hash.blockhash;
        return await this.#signAndSendTransaction(transaction)
    }

    closeTrove = async (clientKey: PublicKey) => {
        const clientTokenAccountKey = await getOrCreateTokenAccount(this.connection, this.provider, clientKey);
        let wallet_balance:any = await getAccount(
            this.connection,
            clientTokenAccountKey
        );
        wallet_balance = wallet_balance.amount.toString()/1e9
        const troveDataAccount = await this.getTrove(clientKey);
        if(wallet_balance<troveDataAccount.totalDept-troveDataAccount.liquidationReserve){
            throw new Error("You have insufficient balance");
            return
        }
        if (!troveDataAccount) {
            throw new Error("Client does not have any trove");
            return
        }
        const transaction = new Transaction().add(
            this.#troveCloseInstruction(clientKey, clientTokenAccountKey, troveDataAccount.dataAccountPublicKey),
        );
        transaction.feePayer = clientKey;
        let hash = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = hash.blockhash;
        return await this.#signAndSendTransaction(transaction)
    }

    redemption = async (clientKey: PublicKey, redeemTokenAmount: number) => {
        if (redeemTokenAmount === 0) {
            throw new Error("Redemption amount should be greater than 0")
        }
        const troves = await this.getAllTrove();
        let count = 0;
        let dept = 0;
        while (count < troves.length) {
            dept += troves[count].totalDept;
            if (dept >= redeemTokenAmount) {
                break;
            }
            count+=1;
        }
        if (dept < redeemTokenAmount) {
            throw new Error("Cannot do redemption at a moment");
        }
        const clientTokenAccountKey = await getOrCreateTokenAccount(this.connection, this.provider, clientKey);
        const transaction = new Transaction().add(
            this.#redemptionInstruction(clientKey, clientTokenAccountKey, redeemTokenAmount, troves.slice(0, count+1)));
        transaction.feePayer = clientKey;
        let hash = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = hash.blockhash;
        return await this.#signAndSendTransaction(transaction)
    }

    #getTroveDataAccountInfo = async (clientKey: PublicKey, filters) => {
        const accounts = await this.connection.getProgramAccounts(TROVE_PROGRAM_KEY, {filters});
        if (accounts.length === 0) {
            return null;
        }
        const solanaPrice = await getSolanaPriceInUSD();
        const tokenPrice = await getTokenPriceInUSD();
        return this.#serializeTroveData(accounts[0].pubkey, accounts[0].account.data, solanaPrice, tokenPrice);
    }

    #serializeTroveData = (publicKey: PublicKey, accountData: Buffer, solanaPrice: number, tokenPrice: number) => {
        let troveData = TroveModel.decode(accountData);
        let serialized_data: any = Object.keys(troveData).reduce((data: object, key: string) => {
            switch (key) {
                case "owner":
                    data["owner"] = new PublicKey(troveData["owner"])
                    break
                case "collateral":
                    const collateral = parseInt(troveData["collateral"].toString())
                    data["collateral"] = Number((collateral / DECIMALS).toFixed(COLLATERAL_DECIMAL))
                    data["collateralBigInt"] = collateral
                    break
                case "dept":
                    const dept = parseInt(troveData["dept"].toString())
                    data["dept"] = Number((dept / DECIMALS).toFixed(DEPT_DECIMAL))
                    data["deptBigInt"] = dept
                    break
                case "liquidation_reserve":
                    const liquidation_reserve = parseInt(troveData["liquidation_reserve"].toString())
                    data["liquidationReserve"] = Number((liquidation_reserve / DECIMALS).toFixed(LIQUIDATION_RESERVE_DECIMAL))
                    data["liquidationReserveBigInt"] = liquidation_reserve
                    break
                case "total_dept":
                    const total_dept = parseInt(troveData["total_dept"].toString())
                    data["totalDept"] = Number((total_dept / DECIMALS).toFixed(TOTAL_DEPT_DECIMAL))
                    data["totalDeptBigInt"] = total_dept
                    break
                default:
                    data[key] = troveData[key]
            }
            data["collateralRatio"] = Number(((data["collateral"] * solanaPrice) / (data["totalDept"] * tokenPrice) * 100).toFixed(COLLATERAL_RATIO_DECIMAL))
            return data
        }, {})
        serialized_data.dataAccountPublicKey = publicKey
        return serialized_data;
    }

    #createTrove = async (clientKey: PublicKey, collateral: number, dept: number) => {
        let troveDataAccount = Keypair.generate();
        let allTroves= await this.#getAllTrovesCreator();
        const clientTokenAccountKey = await getOrCreateTokenAccount(this.connection, this.provider, clientKey)
        const transaction = new Transaction().add(
            this.#troveCreateInstruction(clientKey, clientTokenAccountKey, collateral, dept, troveDataAccount.publicKey,allTroves),
        );
        transaction.feePayer = clientKey;
        let hash = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = hash.blockhash;
        transaction.sign(troveDataAccount);
        return this.#signAndSendTransaction(transaction)
    }

    #updateTrove = async (clientKey: PublicKey, collateral: number, dept: number, troveDataAccountKey: PublicKey) => {
        const clientTokenAccountKey = await getOrCreateTokenAccount(this.connection, this.provider, clientKey)
        let allTroves= await this.#getAllTrovesCreator();
        const transaction = new Transaction().add(
            this.#troveUpdateInstruction(clientKey, clientTokenAccountKey, collateral, dept, troveDataAccountKey,allTroves),
        );
        transaction.feePayer = clientKey;
        let hash = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = hash.blockhash;
        return await this.#signAndSendTransaction(transaction)
    }
    calculate_tcr = (total_troves, solana_price)=> {
        let total_collateral = 0.0;
        let total_borrow = 0.0;
        let tcr_values = total_troves.reduce((acc,i)=>{
            acc.tcr_collateral +=i.collateral * solana_price
            acc.tcr_borrow += i.totalDept
            return acc
        },{
            tcr_collateral:0.0,
            tcr_borrow:0.0,
        })
        return tcr_values;
    }
    #troveCreateInstruction = (clientKey: PublicKey, clientTokenAccountKey: PublicKey, collateral: number, dept: number, troveDataAccountKey: PublicKey, allTroves:any[]) => {
        let data = Buffer.alloc(TroveModel.span);
        TroveModel.encode({
            owner: clientKey.toBuffer(),
            collateral: BigInt(collateral * DECIMALS),
            dept: BigInt(dept * DECIMALS),
        }, data);
        return new TransactionInstruction({
            keys: [
                {pubkey: clientKey, isSigner: true, isWritable: true},
                {pubkey: TROVE_PROGRAM_PDA_KEY, isSigner: false, isWritable: true},
                {pubkey: clientTokenAccountKey, isSigner: false, isWritable: true},
                {pubkey: TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true},
                {pubkey: troveDataAccountKey, isSigner: false, isWritable: true},
                {pubkey: MINT_KEY, isSigner: false, isWritable: true},
                {pubkey: SOLANA_PRICE_ACCOUNT_DEVNET, isSigner: false, isWritable: false},
                {pubkey: TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: BASE_RATE_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: RECOVERY_MODE_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
                ...allTroves.map(pool => ({pubkey: pool.accountPubkey, isSigner: false, isWritable: true})),

            ],
            data: Buffer.concat([TROVE_CREATE_INSTRUCTION, data]),
            programId: TROVE_PROGRAM_KEY,
        })
    }

    #troveUpdateInstruction = (clientKey: PublicKey, clientTokenAccountKey: PublicKey, collateral: number, dept: number, troveDataAccountKey: PublicKey,allTroves:any[]) => {
        let data = Buffer.alloc(TroveModel.span);
        TroveModel.encode({
            owner: clientKey.toBuffer(),
            collateral: BigInt(collateral * DECIMALS),
            dept: BigInt(dept * DECIMALS),
        }, data);
        return new TransactionInstruction({
            keys: [
                {pubkey: clientKey, isSigner: true, isWritable: true},
                {pubkey: TROVE_PROGRAM_PDA_KEY, isSigner: false, isWritable: true},
                {pubkey: clientTokenAccountKey, isSigner: false, isWritable: true},
                {pubkey: TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true},
                {pubkey: troveDataAccountKey, isSigner: false, isWritable: true},
                {pubkey: MINT_KEY, isSigner: false, isWritable: true},
                {pubkey: SOLANA_PRICE_ACCOUNT_DEVNET, isSigner: false, isWritable: false},
                {pubkey: TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: BASE_RATE_ACCOUNT, isSigner: false, isWritable: false},
                {pubkey: RECOVERY_MODE_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
                ...allTroves.filter(x=>x.accountPubkey!=troveDataAccountKey).map(pool => ({pubkey: pool.accountPubkey, isSigner: false, isWritable: true})),
            ],
            data: Buffer.concat([TROVE_UPDATE_INSTRUCTION, data]),
            programId: TROVE_PROGRAM_KEY,
        })
    }

    #troveCloseInstruction = (clientKey: PublicKey, clientTokenAccountKey: PublicKey, troveDataAccountKey: PublicKey) => {
        return new TransactionInstruction({
            keys: [
                {pubkey: clientKey, isSigner: true, isWritable: true},
                {pubkey: TROVE_PROGRAM_PDA_KEY, isSigner: false, isWritable: true},
                {pubkey: clientTokenAccountKey, isSigner: false, isWritable: true},
                {pubkey: TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true},
                {pubkey: troveDataAccountKey, isSigner: false, isWritable: true},
                {pubkey: TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            ],
            data: Buffer.concat([TROVE_CLOSE_INSTRUCTION]),
            programId: TROVE_PROGRAM_KEY,
        })
    }
    #troveLiquidateInstruction = async (clientKey: PublicKey, clientTokenAccountKey: PublicKey, troveDataAccountKey: PublicKey, pools: any[], troves: any[]) => {
        return new TransactionInstruction({
            keys: [
                {pubkey: clientKey, isSigner: true, isWritable: true},
                {pubkey: clientTokenAccountKey, isSigner: false, isWritable: true},
                {pubkey: TROVE_PROGRAM_PDA_KEY, isSigner: false, isWritable: true},
                {pubkey: TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true},
                {pubkey: STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true},
                {pubkey: troveDataAccountKey, isSigner: false, isWritable: true},
                {pubkey: MINT_KEY, isSigner: false, isWritable: true},
                {pubkey: STABILITY_POOL_PROGRAM_KEY, isSigner: false, isWritable: false},
                {pubkey: STABILITY_POOL_PROGRAM_PDA_KEY, isSigner: false, isWritable: true},
                {pubkey: SOLANA_PRICE_ACCOUNT_DEVNET, isSigner: false, isWritable: false},
                {pubkey: STABILITY_POOL_RECORD_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: RECOVERY_MODE_ACCOUNT, isSigner: false, isWritable: true},

                ...(pools.map(pool => ({pubkey: pool.accountPubkey, isSigner: false, isWritable: true}))),
                ...(troves.filter(trove => trove.accountPubkey.toBase58() != troveDataAccountKey.toBase58()).map(pool => ({
                    pubkey: pool.accountPubkey,
                    isSigner: false,
                    isWritable: true
                }))),
                ...(pools.map(pool => ({pubkey: pool.ownerPubkey, isSigner: false, isWritable: true}))),
                ...(troves.map(trove => ({pubkey: trove.ownerPubkey, isSigner: false, isWritable: true}))),
            ],
            data: Buffer.concat([TROVE_LIQUIDATE_INSTRUCTION]),
            programId: TROVE_PROGRAM_KEY,
        })
    }

    #redemptionInstruction = (clientKey: PublicKey, clientTokenAccountKey: PublicKey, redeemTokenAmount: number, troves: any[]) => {
        let data = new Buffer(8);
        data.writeBigUInt64BE(BigInt(redeemTokenAmount * DECIMALS))
        return new TransactionInstruction({
            keys: [
                {pubkey: clientKey, isSigner: true, isWritable: true},
                {pubkey: TROVE_PROGRAM_PDA_KEY, isSigner: false, isWritable: true},
                {pubkey: clientTokenAccountKey, isSigner: false, isWritable: true},
                {pubkey: TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true},
                {pubkey: SOLANA_PRICE_ACCOUNT_DEVNET, isSigner: false, isWritable: false},
                {pubkey: TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                {pubkey: BASE_RATE_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: MINT_KEY, isSigner: false, isWritable: true},
                ...(troves.map(trove => ({pubkey: trove.dataAccountPublicKey, isSigner: false, isWritable: true}))),
            ],
            data: Buffer.concat([REDEMPTION_INSTRUCTION, data]),
            programId: TROVE_PROGRAM_KEY,
        })
    }
    deployMint = async (clientKey: PublicKey) => {
        let token = Keypair.generate();
        const transaction = new Transaction().add(
            new TransactionInstruction({
                keys: [
                    {pubkey: clientKey, isSigner: true, isWritable: true},
                    {pubkey: token.publicKey, isSigner: true, isWritable: true},
                    {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                    {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                    {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},

                ],
                data: new Buffer([5]),
                programId: TROVE_PROGRAM_KEY,
            })
        );
        transaction.feePayer = clientKey;
        let hash = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = hash.blockhash;
        transaction.sign(token)
        return await this.#signAndSendTransaction(transaction)
    }
    applyRecoveryMode = async (clientKey: PublicKey) => {
        let allTroves= await this.#getAllTrovesCreator();
        const transaction = new Transaction().add(
            new TransactionInstruction({
                keys: [
                    {pubkey: clientKey, isSigner: true, isWritable: true},
                    {pubkey: RECOVERY_MODE_ACCOUNT, isSigner: false, isWritable: true},
                    {pubkey: TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true},
                    {pubkey: SOLANA_PRICE_ACCOUNT_DEVNET, isSigner: false, isWritable: true},
                    ...allTroves.map(pool => ({pubkey: pool.accountPubkey, isSigner: false, isWritable: true})),
                    {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                    {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
                    {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},

                ],
                data: new Buffer([6]),
                programId: TROVE_PROGRAM_KEY,
            })
        );
        transaction.feePayer = clientKey;
        let hash = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = hash.blockhash;
        return await this.#signAndSendTransaction(transaction)
    }

    #signAndSendTransaction = async (transaction: Transaction) => {
        return signAndSendTransaction(this.connection, this.provider, transaction);
    }
}