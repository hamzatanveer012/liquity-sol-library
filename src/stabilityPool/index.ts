import {
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import {Buffer} from "buffer";
import {StabilityPoolModel} from "./models";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {encode} from "bs58"
import {
    OPEN_OFFSET,
    OWNER_OFFSET,
    STABILITY_POOL_CREATE_INSTRUCTION,
    STABILITY_POOL_OPEN,
    STABILITY_POOL_UPDATE_INSTRUCTION
} from "./constants";
import {Web3Service} from "../web3Service";
import {
    DECIMALS,
    DEPOSIT_DECIMAL,
    STABILITY_POOL_PROGRAM_KEY,
    STABILITY_POOL_PROGRAM_PDA_KEY,
    STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY,
    STABILITY_POOL_RECORD_ACCOUNT
} from "../config";
import {getOrCreateTokenAccount, signAndSendTransaction} from "../utils";

export class StabilityPool extends Web3Service {

    getStabilityPool = async (clientKey: PublicKey) => {
        const filters = [
            {memcmp: {offset: OWNER_OFFSET, bytes: clientKey.toBase58()}},
            {memcmp: {offset: OPEN_OFFSET, bytes: encode(STABILITY_POOL_OPEN)}},
        ];
        return this.#getStabilityPoolDataAccountInfo(clientKey, filters);
    }
    getAllStabilityPoolProviders = async () => {
        const filters = [
            {memcmp: {offset: OPEN_OFFSET, bytes: encode(STABILITY_POOL_OPEN)}},
        ];
        const accounts = await this.connection.getProgramAccounts(STABILITY_POOL_PROGRAM_KEY, {filters});
        return accounts.map((account) => ({
            accountPubkey: account.pubkey,
            ownerPubkey: this.#serializeStabilityPoolData(account.pubkey, account.account.data).owner
        }));
    }

    getTotalTokensInStabilityPool = async () => {
        const tokensInStabilityPool = await this.connection.getTokenAccountBalance(STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY);
        return Number(tokensInStabilityPool.value.amount) / LAMPORTS_PER_SOL
    }

    depositInStabilityPool = async (clientKey: PublicKey, tokenAmount: number) => {
        const filters = [
            {memcmp: {offset: OWNER_OFFSET, bytes: clientKey.toBase58()}},
        ];
        const stabilityPoolDataAccountInfo = await this.#getStabilityPoolDataAccountInfo(clientKey, filters);
        const amount = tokenAmount * DECIMALS;
        if (!stabilityPoolDataAccountInfo) {
            if (tokenAmount === 0) {
                throw new Error('Deposit must be greater than 0');
            }
            return await this.#createStabilityPool(clientKey, amount);
        } else {
            if (stabilityPoolDataAccountInfo["amount"] === amount) {
                throw new Error('Stability Pool deposit amount is unchanged');
            }
            return await this.#updateStabilityPool(clientKey, amount, stabilityPoolDataAccountInfo.dataAccountPublicKey);
        }
    }

    #getStabilityPoolDataAccountInfo = async (clientKey: PublicKey, filters) => {
        const accounts = await this.connection.getProgramAccounts(STABILITY_POOL_PROGRAM_KEY, {filters});
        if (accounts.length === 0) {
            return null;
        }
        return this.#serializeStabilityPoolData(accounts[0].pubkey, accounts[0].account.data);
    }

    #serializeStabilityPoolData = (publicKey: PublicKey, accountData: Buffer) => {
        let stabilityPoolData = StabilityPoolModel.decode(accountData);
        let serialized_data: any = Object.keys(stabilityPoolData).reduce((data: object, key: string) => {
            switch (key) {
                case "owner":
                    data["owner"] = new PublicKey(stabilityPoolData["owner"])
                    break
                case "amount":
                    const amount = parseInt(stabilityPoolData["amount"].toString())
                    data["amount"] = Number((amount / DECIMALS).toFixed(DEPOSIT_DECIMAL))
                    data["amountBigInt"] = amount
                    break
                default:
                    data[key] = stabilityPoolData[key]
            }
            return data
        }, {})
        serialized_data.dataAccountPublicKey = publicKey
        return serialized_data;
    }

    #createStabilityPool = async (clientKey: PublicKey, tokenAmount: number) => {
        let newStabilityPoolDataAccount = Keypair.generate();
        const clientTokenAccountKey = await getOrCreateTokenAccount(this.connection, this.provider, clientKey, clientKey)
        const transaction = new Transaction().add(
            this.#stabilityPoolCreateInstruction(clientKey, clientTokenAccountKey, tokenAmount, newStabilityPoolDataAccount.publicKey),
        );
        transaction.feePayer = clientKey;
        let hash = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = hash.blockhash;
        transaction.sign(newStabilityPoolDataAccount);
        return await this.#signAndSendTransaction(transaction)
    }

    #updateStabilityPool = async (clientKey: PublicKey, tokenAmount: number, stabilityPoolDataAccountKey: PublicKey) => {
        const clientTokenAccountKey = await getOrCreateTokenAccount(this.connection, this.provider, clientKey, clientKey)
        const transaction = new Transaction().add(
            this.#stabilityPoolUpdateInstruction(clientKey, clientTokenAccountKey, tokenAmount, stabilityPoolDataAccountKey),
        );
        transaction.feePayer = clientKey;
        let hash = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = hash.blockhash;
        return await this.#signAndSendTransaction(transaction)
    }

    #stabilityPoolCreateInstruction(clientKey: PublicKey, clientTokenAccountKey: PublicKey, tokenAmount: number, stabilityPoolDataAccountKey: PublicKey) {
        let data = Buffer.alloc(StabilityPoolModel.span);
        StabilityPoolModel.encode({
            owner: clientKey.toBuffer(),
            amount: BigInt(tokenAmount),
            open: true,
        }, data);
        return new TransactionInstruction({
            keys: [
                {pubkey: clientKey, isSigner: true, isWritable: true},
                {pubkey: clientTokenAccountKey, isSigner: false, isWritable: true},
                {pubkey: STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true},
                {pubkey: stabilityPoolDataAccountKey, isSigner: false, isWritable: true},
                {pubkey: STABILITY_POOL_RECORD_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            ],
            data: Buffer.concat([STABILITY_POOL_CREATE_INSTRUCTION, data]),
            programId: STABILITY_POOL_PROGRAM_KEY,
        })
    }

    #stabilityPoolUpdateInstruction(clientKey: PublicKey, clientTokenAccountKey: PublicKey, tokenAmount: number, stabilityPoolDataAccountKey: PublicKey) {
        let data = Buffer.alloc(StabilityPoolModel.span);
        StabilityPoolModel.encode({
            owner: clientKey.toBuffer(),
            amount: BigInt(tokenAmount),
            open: true,
        }, data);
        return new TransactionInstruction({
            keys: [
                {pubkey: clientKey, isSigner: true, isWritable: true},
                {pubkey: clientTokenAccountKey, isSigner: false, isWritable: true},
                {pubkey: STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true},
                {pubkey: stabilityPoolDataAccountKey, isSigner: false, isWritable: true},
                {pubkey: STABILITY_POOL_PROGRAM_PDA_KEY, isSigner: false, isWritable: false},
                {pubkey: STABILITY_POOL_RECORD_ACCOUNT, isSigner: false, isWritable: true},
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            ],
            data: Buffer.concat([STABILITY_POOL_UPDATE_INSTRUCTION, data]),
            programId: STABILITY_POOL_PROGRAM_KEY,
        })
    }

    #signAndSendTransaction = async (transaction: Transaction) => {
        return signAndSendTransaction(this.connection, this.provider, transaction);
    }
}