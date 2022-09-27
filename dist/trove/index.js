"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Trove_getAllTrovesCreator, _Trove_getTroveDataAccountInfo, _Trove_serializeTroveData, _Trove_createTrove, _Trove_updateTrove, _Trove_troveCreateInstruction, _Trove_troveUpdateInstruction, _Trove_troveCloseInstruction, _Trove_troveLiquidateInstruction, _Trove_redemptionInstruction, _Trove_signAndSendTransaction;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trove = void 0;
const web3_js_1 = require("@solana/web3.js");
const web3Service_1 = require("../web3Service");
const buffer_1 = require("buffer");
const models_1 = require("./models");
const config_1 = require("../config");
const spl_token_1 = require("@solana/spl-token");
const utils_1 = require("../utils");
const bs58_1 = require("bs58");
const constants_1 = require("./constants");
const stabilityPool_1 = require("../stabilityPool");
class Trove extends web3Service_1.Web3Service {
    constructor() {
        super(...arguments);
        this.getTokenSupply = () => __awaiter(this, void 0, void 0, function* () {
            let mint = yield (0, spl_token_1.getMint)(this.connection, config_1.MINT_KEY);
            return (parseInt(mint.supply.toString()) / config_1.DECIMALS).toFixed(config_1.PRECISION);
        });
        this.getMiminumCollateralRatioForBorrowing = () => __awaiter(this, void 0, void 0, function* () {
            let recovery_mode = yield this.getRecoveryMode();
            if (recovery_mode) {
                return 150;
            }
            return 110;
        });
        this.getRecoveryMode = () => __awaiter(this, void 0, void 0, function* () {
            let recovery_acc = yield this.connection.getAccountInfo(config_1.RECOVERY_MODE_ACCOUNT);
            return Boolean(recovery_acc.data[0]);
        });
        this.getRedemptionFee = () => __awaiter(this, void 0, void 0, function* () {
            return config_1.REDEMPTION_FEE_ADDON + (yield this.getBaseRate());
        });
        this.getBorrowFee = () => __awaiter(this, void 0, void 0, function* () {
            let is_recovery = yield this.getRecoveryMode();
            let fee = config_1.REDEMPTION_FEE_ADDON + (yield this.getBaseRate());
            fee = Math.min(fee, 5);
            fee = Math.max(fee, 0);
            return is_recovery ? 0 : fee;
        });
        this.applyTimeDecay = (rate, time) => __awaiter(this, void 0, void 0, function* () {
            let current_time = Math.floor(Date.now() / 1000);
            let weeks = ((current_time - time) / 604800);
            let new_rate = rate - weeks * (config_1.BASE_RATE_DECAY_PER_WEEK * rate);
            if (new_rate < 0) {
                new_rate = 0;
            }
            return new_rate;
        });
        this.getBaseRate = () => __awaiter(this, void 0, void 0, function* () {
            let base_rate_account = yield this.connection.getAccountInfo(config_1.BASE_RATE_ACCOUNT);
            let { base_rate: rate, timestamp: time } = models_1.BaseRateRecordModel.decode(base_rate_account.data);
            let base_rate = parseInt(rate.toString()) / config_1.DECIMALS;
            let timestamp = parseInt(time.toString());
            return this.applyTimeDecay(base_rate, timestamp);
        });
        this.getTrove = (clientKey) => __awaiter(this, void 0, void 0, function* () {
            const filters = [
                { memcmp: { offset: constants_1.OWNER_OFFSET, bytes: clientKey.toBase58() } },
                { memcmp: { offset: constants_1.OPEN_OFFSET, bytes: (0, bs58_1.encode)(constants_1.TROVE_OPEN) } },
            ];
            return __classPrivateFieldGet(this, _Trove_getTroveDataAccountInfo, "f").call(this, clientKey, filters);
        });
        this.getAllTrove = () => __awaiter(this, void 0, void 0, function* () {
            const filters = [
                { memcmp: { offset: constants_1.OPEN_OFFSET, bytes: (0, bs58_1.encode)(constants_1.TROVE_OPEN) } },
            ];
            const solanaPrice = yield (0, utils_1.getSolanaPriceInUSD)();
            const tokenPrice = yield (0, utils_1.getTokenPriceInUSD)();
            const accounts = yield this.connection.getProgramAccounts(config_1.TROVE_PROGRAM_KEY, { filters });
            let troves = accounts.map((account) => __classPrivateFieldGet(this, _Trove_serializeTroveData, "f").call(this, account.pubkey, account.account.data, solanaPrice, tokenPrice));
            return troves.sort((trove1, trove2) => trove1.collateralRatio - trove2.collateralRatio);
        });
        this.getTroveConfig = () => __awaiter(this, void 0, void 0, function* () {
            // store data in account and get data from account
            // update account data when necessary
            return {
                liquidationReserve: 1,
                borrowingFeePercent: 0.5,
            };
        });
        _Trove_getAllTrovesCreator.set(this, () => __awaiter(this, void 0, void 0, function* () {
            const filters = [
                { memcmp: { offset: constants_1.OPEN_OFFSET, bytes: (0, bs58_1.encode)(constants_1.TROVE_OPEN) } },
            ];
            const accounts = yield this.connection.getProgramAccounts(config_1.TROVE_PROGRAM_KEY, { filters });
            const solanaPrice = yield (0, utils_1.getSolanaPriceInUSD)();
            const tokenPrice = yield (0, utils_1.getTokenPriceInUSD)();
            return accounts.map((account) => (Object.assign(Object.assign({}, __classPrivateFieldGet(this, _Trove_serializeTroveData, "f").call(this, account.pubkey, account.account.data, solanaPrice, tokenPrice)), { accountPubkey: account.pubkey, ownerPubkey: __classPrivateFieldGet(this, _Trove_serializeTroveData, "f").call(this, account.pubkey, account.account.data, solanaPrice, tokenPrice).owner })));
        }));
        this.createOrUpdateTrove = (clientKey, collateral, dept) => __awaiter(this, void 0, void 0, function* () {
            if (collateral <= 0) {
                throw new Error("Collateral must be greater than 0");
            }
            if (dept <= 0) {
                throw new Error("Dept must be greater than 0");
            }
            const filters = [
                { memcmp: { offset: constants_1.OWNER_OFFSET, bytes: clientKey.toBase58() } },
                { memcmp: { offset: constants_1.OPEN_OFFSET, bytes: (0, bs58_1.encode)(constants_1.TROVE_OPEN) } },
            ];
            const troveDataAccountInfo = yield __classPrivateFieldGet(this, _Trove_getTroveDataAccountInfo, "f").call(this, clientKey, filters);
            const troveConfig = yield this.getTroveConfig();
            let totalDept;
            if (troveDataAccountInfo) {
                if (troveDataAccountInfo.owner.toBase58() !== clientKey.toBase58()) {
                    throw new Error("You are not the owner of the Trove account, you are trying to update\"");
                }
                if (troveDataAccountInfo.dept === dept && troveDataAccountInfo.collateral === collateral) {
                    throw new Error("Collateral and Dept are unchanged");
                }
                if (dept > troveDataAccountInfo.dept) {
                    const deptDiff = dept - troveDataAccountInfo.dept;
                    totalDept = troveDataAccountInfo.totalDept + ((troveConfig.borrowingFeePercent * deptDiff) / 100) + deptDiff;
                }
                else {
                    totalDept = troveDataAccountInfo.totalDept - (troveDataAccountInfo.dept - dept);
                }
            }
            else {
                totalDept = troveConfig.liquidationReserve + ((troveConfig.borrowingFeePercent * dept) / 100) + dept;
            }
            if (totalDept < config_1.MINIMUM_TOTAL_DEPT) {
                throw new Error('Total Dept is less than Minimum Total Dept of ' + config_1.MINIMUM_TOTAL_DEPT);
            }
            const solanaPrice = yield (0, utils_1.getSolanaPriceInUSD)();
            let allTroves = yield this.getAllTrove();
            let tcr = this.calculate_tcr(allTroves.filter(x => x.owner.toBase58() != clientKey.toBase58()), solanaPrice);
            if ((((tcr.tcr_collateral + (collateral * solanaPrice)) / (tcr.tcr_borrow + totalDept))) * 100 < 150) {
                throw new Error("Trove collateral ratio is insufficient, It shouldnt cause TCR below 150");
            }
            const tokenPrice = yield (0, utils_1.getTokenPriceInUSD)();
            const collateral_ratio_percent = ((collateral * solanaPrice) / (totalDept * tokenPrice)) * 100;
            if (collateral_ratio_percent < config_1.MINIMUM_COLLATERAL_RATIO) {
                throw new Error('Collateral Ratio is less than Minimum Collateral Ratio of ' + config_1.MINIMUM_COLLATERAL_RATIO);
            }
            if (troveDataAccountInfo) {
                return yield __classPrivateFieldGet(this, _Trove_updateTrove, "f").call(this, clientKey, collateral, dept, troveDataAccountInfo.dataAccountPublicKey);
            }
            else {
                return yield __classPrivateFieldGet(this, _Trove_createTrove, "f").call(this, clientKey, collateral, dept);
            }
        });
        this.liquidateTrove = (clientKey, troveDataAccountKey) => __awaiter(this, void 0, void 0, function* () {
            const account = yield this.connection.getAccountInfo(troveDataAccountKey);
            const solanaPrice = yield (0, utils_1.getSolanaPriceInUSD)();
            const tokenPrice = yield (0, utils_1.getTokenPriceInUSD)();
            const troveDataAccountInfo = __classPrivateFieldGet(this, _Trove_serializeTroveData, "f").call(this, account.owner, account.data, solanaPrice, tokenPrice);
            const collateral_ratio_percent = ((troveDataAccountInfo.collateral * solanaPrice) / (troveDataAccountInfo.totalDept * tokenPrice)) * 100;
            // if (collateral_ratio_percent > MINIMUM_COLLATERAL_RATIO) {
            //     throw new Error("Cannot liquidate a trove with a Collateral Ratio greater than " + MINIMUM_COLLATERAL_RATIO + "%");
            // }
            const clientTokenAccountKey = yield (0, utils_1.getOrCreateTokenAccount)(this.connection, this.provider, clientKey);
            const totalTokensInStabilityPool = Number((yield this.connection.getTokenAccountBalance(config_1.STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY)).value.uiAmountString);
            let pools = [];
            if (totalTokensInStabilityPool > 0) {
                pools = yield new stabilityPool_1.StabilityPool(this.connection, this.provider).getAllStabilityPoolProviders();
            }
            let troves = [];
            if (totalTokensInStabilityPool < troveDataAccountInfo.totalDept) {
                troves = yield __classPrivateFieldGet(this, _Trove_getAllTrovesCreator, "f").call(this);
            }
            const instruction = yield __classPrivateFieldGet(this, _Trove_troveLiquidateInstruction, "f").call(this, clientKey, clientTokenAccountKey, troveDataAccountKey, pools, troves);
            const transaction = new web3_js_1.Transaction().add(instruction);
            transaction.feePayer = clientKey;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            return yield __classPrivateFieldGet(this, _Trove_signAndSendTransaction, "f").call(this, transaction);
        });
        this.closeTrove = (clientKey) => __awaiter(this, void 0, void 0, function* () {
            const clientTokenAccountKey = yield (0, utils_1.getOrCreateTokenAccount)(this.connection, this.provider, clientKey);
            let wallet_balance = yield (0, spl_token_1.getAccount)(this.connection, clientTokenAccountKey);
            wallet_balance = wallet_balance.amount.toString() / 1e9;
            const troveDataAccount = yield this.getTrove(clientKey);
            if (wallet_balance < troveDataAccount.totalDept - troveDataAccount.liquidationReserve) {
                throw new Error("You have insufficient balance");
                return;
            }
            if (!troveDataAccount) {
                throw new Error("Client does not have any trove");
                return;
            }
            const transaction = new web3_js_1.Transaction().add(__classPrivateFieldGet(this, _Trove_troveCloseInstruction, "f").call(this, clientKey, clientTokenAccountKey, troveDataAccount.dataAccountPublicKey));
            transaction.feePayer = clientKey;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            return yield __classPrivateFieldGet(this, _Trove_signAndSendTransaction, "f").call(this, transaction);
        });
        this.redemption = (clientKey, redeemTokenAmount) => __awaiter(this, void 0, void 0, function* () {
            if (redeemTokenAmount === 0) {
                throw new Error("Redemption amount should be greater than 0");
            }
            const troves = yield this.getAllTrove();
            let count = 0;
            let dept = 0;
            while (count < troves.length) {
                dept += troves[count].totalDept;
                if (dept >= redeemTokenAmount) {
                    break;
                }
                count += 1;
            }
            if (dept < redeemTokenAmount) {
                throw new Error("Cannot do redemption at a moment");
            }
            const clientTokenAccountKey = yield (0, utils_1.getOrCreateTokenAccount)(this.connection, this.provider, clientKey);
            const transaction = new web3_js_1.Transaction().add(__classPrivateFieldGet(this, _Trove_redemptionInstruction, "f").call(this, clientKey, clientTokenAccountKey, redeemTokenAmount, troves.slice(0, count + 1)));
            transaction.feePayer = clientKey;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            return yield __classPrivateFieldGet(this, _Trove_signAndSendTransaction, "f").call(this, transaction);
        });
        _Trove_getTroveDataAccountInfo.set(this, (clientKey, filters) => __awaiter(this, void 0, void 0, function* () {
            const accounts = yield this.connection.getProgramAccounts(config_1.TROVE_PROGRAM_KEY, { filters });
            if (accounts.length === 0) {
                return null;
            }
            const solanaPrice = yield (0, utils_1.getSolanaPriceInUSD)();
            const tokenPrice = yield (0, utils_1.getTokenPriceInUSD)();
            return __classPrivateFieldGet(this, _Trove_serializeTroveData, "f").call(this, accounts[0].pubkey, accounts[0].account.data, solanaPrice, tokenPrice);
        }));
        _Trove_serializeTroveData.set(this, (publicKey, accountData, solanaPrice, tokenPrice) => {
            let troveData = models_1.TroveModel.decode(accountData);
            let serialized_data = Object.keys(troveData).reduce((data, key) => {
                switch (key) {
                    case "owner":
                        data["owner"] = new web3_js_1.PublicKey(troveData["owner"]);
                        break;
                    case "collateral":
                        const collateral = parseInt(troveData["collateral"].toString());
                        data["collateral"] = Number((collateral / config_1.DECIMALS).toFixed(config_1.COLLATERAL_DECIMAL));
                        data["collateralBigInt"] = collateral;
                        break;
                    case "dept":
                        const dept = parseInt(troveData["dept"].toString());
                        data["dept"] = Number((dept / config_1.DECIMALS).toFixed(config_1.DEPT_DECIMAL));
                        data["deptBigInt"] = dept;
                        break;
                    case "liquidation_reserve":
                        const liquidation_reserve = parseInt(troveData["liquidation_reserve"].toString());
                        data["liquidationReserve"] = Number((liquidation_reserve / config_1.DECIMALS).toFixed(config_1.LIQUIDATION_RESERVE_DECIMAL));
                        data["liquidationReserveBigInt"] = liquidation_reserve;
                        break;
                    case "total_dept":
                        const total_dept = parseInt(troveData["total_dept"].toString());
                        data["totalDept"] = Number((total_dept / config_1.DECIMALS).toFixed(config_1.TOTAL_DEPT_DECIMAL));
                        data["totalDeptBigInt"] = total_dept;
                        break;
                    default:
                        data[key] = troveData[key];
                }
                data["collateralRatio"] = Number(((data["collateral"] * solanaPrice) / (data["totalDept"] * tokenPrice) * 100).toFixed(config_1.COLLATERAL_RATIO_DECIMAL));
                return data;
            }, {});
            serialized_data.dataAccountPublicKey = publicKey;
            return serialized_data;
        });
        _Trove_createTrove.set(this, (clientKey, collateral, dept) => __awaiter(this, void 0, void 0, function* () {
            let troveDataAccount = web3_js_1.Keypair.generate();
            let allTroves = yield __classPrivateFieldGet(this, _Trove_getAllTrovesCreator, "f").call(this);
            const clientTokenAccountKey = yield (0, utils_1.getOrCreateTokenAccount)(this.connection, this.provider, clientKey);
            const transaction = new web3_js_1.Transaction().add(__classPrivateFieldGet(this, _Trove_troveCreateInstruction, "f").call(this, clientKey, clientTokenAccountKey, collateral, dept, troveDataAccount.publicKey, allTroves));
            transaction.feePayer = clientKey;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            transaction.sign(troveDataAccount);
            return __classPrivateFieldGet(this, _Trove_signAndSendTransaction, "f").call(this, transaction);
        }));
        _Trove_updateTrove.set(this, (clientKey, collateral, dept, troveDataAccountKey) => __awaiter(this, void 0, void 0, function* () {
            const clientTokenAccountKey = yield (0, utils_1.getOrCreateTokenAccount)(this.connection, this.provider, clientKey);
            let allTroves = yield __classPrivateFieldGet(this, _Trove_getAllTrovesCreator, "f").call(this);
            const transaction = new web3_js_1.Transaction().add(__classPrivateFieldGet(this, _Trove_troveUpdateInstruction, "f").call(this, clientKey, clientTokenAccountKey, collateral, dept, troveDataAccountKey, allTroves));
            transaction.feePayer = clientKey;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            return yield __classPrivateFieldGet(this, _Trove_signAndSendTransaction, "f").call(this, transaction);
        }));
        this.calculate_tcr = (total_troves, solana_price) => {
            let total_collateral = 0.0;
            let total_borrow = 0.0;
            let tcr_values = total_troves.reduce((acc, i) => {
                acc.tcr_collateral += i.collateral * solana_price;
                acc.tcr_borrow += i.totalDept;
                return acc;
            }, {
                tcr_collateral: 0.0,
                tcr_borrow: 0.0,
            });
            return tcr_values;
        };
        _Trove_troveCreateInstruction.set(this, (clientKey, clientTokenAccountKey, collateral, dept, troveDataAccountKey, allTroves) => {
            let data = buffer_1.Buffer.alloc(models_1.TroveModel.span);
            models_1.TroveModel.encode({
                owner: clientKey.toBuffer(),
                collateral: BigInt(collateral * config_1.DECIMALS),
                dept: BigInt(dept * config_1.DECIMALS),
            }, data);
            return new web3_js_1.TransactionInstruction({
                keys: [
                    { pubkey: clientKey, isSigner: true, isWritable: true },
                    { pubkey: config_1.TROVE_PROGRAM_PDA_KEY, isSigner: false, isWritable: true },
                    { pubkey: clientTokenAccountKey, isSigner: false, isWritable: true },
                    { pubkey: config_1.TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true },
                    { pubkey: troveDataAccountKey, isSigner: false, isWritable: true },
                    { pubkey: config_1.MINT_KEY, isSigner: false, isWritable: true },
                    { pubkey: config_1.SOLANA_PRICE_ACCOUNT_DEVNET, isSigner: false, isWritable: false },
                    { pubkey: config_1.TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: config_1.BASE_RATE_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: config_1.RECOVERY_MODE_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                    ...allTroves.map(pool => ({ pubkey: pool.accountPubkey, isSigner: false, isWritable: true })),
                ],
                data: buffer_1.Buffer.concat([constants_1.TROVE_CREATE_INSTRUCTION, data]),
                programId: config_1.TROVE_PROGRAM_KEY,
            });
        });
        _Trove_troveUpdateInstruction.set(this, (clientKey, clientTokenAccountKey, collateral, dept, troveDataAccountKey, allTroves) => {
            let data = buffer_1.Buffer.alloc(models_1.TroveModel.span);
            models_1.TroveModel.encode({
                owner: clientKey.toBuffer(),
                collateral: BigInt(collateral * config_1.DECIMALS),
                dept: BigInt(dept * config_1.DECIMALS),
            }, data);
            return new web3_js_1.TransactionInstruction({
                keys: [
                    { pubkey: clientKey, isSigner: true, isWritable: true },
                    { pubkey: config_1.TROVE_PROGRAM_PDA_KEY, isSigner: false, isWritable: true },
                    { pubkey: clientTokenAccountKey, isSigner: false, isWritable: true },
                    { pubkey: config_1.TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true },
                    { pubkey: troveDataAccountKey, isSigner: false, isWritable: true },
                    { pubkey: config_1.MINT_KEY, isSigner: false, isWritable: true },
                    { pubkey: config_1.SOLANA_PRICE_ACCOUNT_DEVNET, isSigner: false, isWritable: false },
                    { pubkey: config_1.TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: config_1.BASE_RATE_ACCOUNT, isSigner: false, isWritable: false },
                    { pubkey: config_1.RECOVERY_MODE_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                    ...allTroves.filter(x => x.accountPubkey != troveDataAccountKey).map(pool => ({ pubkey: pool.accountPubkey, isSigner: false, isWritable: true })),
                ],
                data: buffer_1.Buffer.concat([constants_1.TROVE_UPDATE_INSTRUCTION, data]),
                programId: config_1.TROVE_PROGRAM_KEY,
            });
        });
        _Trove_troveCloseInstruction.set(this, (clientKey, clientTokenAccountKey, troveDataAccountKey) => {
            return new web3_js_1.TransactionInstruction({
                keys: [
                    { pubkey: clientKey, isSigner: true, isWritable: true },
                    { pubkey: config_1.TROVE_PROGRAM_PDA_KEY, isSigner: false, isWritable: true },
                    { pubkey: clientTokenAccountKey, isSigner: false, isWritable: true },
                    { pubkey: config_1.TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true },
                    { pubkey: troveDataAccountKey, isSigner: false, isWritable: true },
                    { pubkey: config_1.TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                ],
                data: buffer_1.Buffer.concat([constants_1.TROVE_CLOSE_INSTRUCTION]),
                programId: config_1.TROVE_PROGRAM_KEY,
            });
        });
        _Trove_troveLiquidateInstruction.set(this, (clientKey, clientTokenAccountKey, troveDataAccountKey, pools, troves) => __awaiter(this, void 0, void 0, function* () {
            return new web3_js_1.TransactionInstruction({
                keys: [
                    { pubkey: clientKey, isSigner: true, isWritable: true },
                    { pubkey: clientTokenAccountKey, isSigner: false, isWritable: true },
                    { pubkey: config_1.TROVE_PROGRAM_PDA_KEY, isSigner: false, isWritable: true },
                    { pubkey: config_1.TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true },
                    { pubkey: config_1.STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true },
                    { pubkey: troveDataAccountKey, isSigner: false, isWritable: true },
                    { pubkey: config_1.MINT_KEY, isSigner: false, isWritable: true },
                    { pubkey: config_1.STABILITY_POOL_PROGRAM_KEY, isSigner: false, isWritable: false },
                    { pubkey: config_1.STABILITY_POOL_PROGRAM_PDA_KEY, isSigner: false, isWritable: true },
                    { pubkey: config_1.SOLANA_PRICE_ACCOUNT_DEVNET, isSigner: false, isWritable: false },
                    { pubkey: config_1.STABILITY_POOL_RECORD_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: config_1.TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: config_1.RECOVERY_MODE_ACCOUNT, isSigner: false, isWritable: true },
                    ...(pools.map(pool => ({ pubkey: pool.accountPubkey, isSigner: false, isWritable: true }))),
                    ...(troves.filter(trove => trove.accountPubkey.toBase58() != troveDataAccountKey.toBase58()).map(pool => ({
                        pubkey: pool.accountPubkey,
                        isSigner: false,
                        isWritable: true
                    }))),
                    ...(pools.map(pool => ({ pubkey: pool.ownerPubkey, isSigner: false, isWritable: true }))),
                    ...(troves.map(trove => ({ pubkey: trove.ownerPubkey, isSigner: false, isWritable: true }))),
                ],
                data: buffer_1.Buffer.concat([constants_1.TROVE_LIQUIDATE_INSTRUCTION]),
                programId: config_1.TROVE_PROGRAM_KEY,
            });
        }));
        _Trove_redemptionInstruction.set(this, (clientKey, clientTokenAccountKey, redeemTokenAmount, troves) => {
            let data = new buffer_1.Buffer(8);
            data.writeBigUInt64BE(BigInt(redeemTokenAmount * config_1.DECIMALS));
            return new web3_js_1.TransactionInstruction({
                keys: [
                    { pubkey: clientKey, isSigner: true, isWritable: true },
                    { pubkey: config_1.TROVE_PROGRAM_PDA_KEY, isSigner: false, isWritable: true },
                    { pubkey: clientTokenAccountKey, isSigner: false, isWritable: true },
                    { pubkey: config_1.TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true },
                    { pubkey: config_1.SOLANA_PRICE_ACCOUNT_DEVNET, isSigner: false, isWritable: false },
                    { pubkey: config_1.TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: config_1.BASE_RATE_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: config_1.MINT_KEY, isSigner: false, isWritable: true },
                    ...(troves.map(trove => ({ pubkey: trove.dataAccountPublicKey, isSigner: false, isWritable: true }))),
                ],
                data: buffer_1.Buffer.concat([constants_1.REDEMPTION_INSTRUCTION, data]),
                programId: config_1.TROVE_PROGRAM_KEY,
            });
        });
        this.deployMint = (clientKey) => __awaiter(this, void 0, void 0, function* () {
            let token = web3_js_1.Keypair.generate();
            const transaction = new web3_js_1.Transaction().add(new web3_js_1.TransactionInstruction({
                keys: [
                    { pubkey: clientKey, isSigner: true, isWritable: true },
                    { pubkey: token.publicKey, isSigner: true, isWritable: true },
                    { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                ],
                data: new buffer_1.Buffer([5]),
                programId: config_1.TROVE_PROGRAM_KEY,
            }));
            transaction.feePayer = clientKey;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            transaction.sign(token);
            return yield __classPrivateFieldGet(this, _Trove_signAndSendTransaction, "f").call(this, transaction);
        });
        this.applyRecoveryMode = (clientKey) => __awaiter(this, void 0, void 0, function* () {
            let allTroves = yield __classPrivateFieldGet(this, _Trove_getAllTrovesCreator, "f").call(this);
            const transaction = new web3_js_1.Transaction().add(new web3_js_1.TransactionInstruction({
                keys: [
                    { pubkey: clientKey, isSigner: true, isWritable: true },
                    { pubkey: config_1.RECOVERY_MODE_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: config_1.TROVE_RECORD_ACCOUNT, isSigner: false, isWritable: true },
                    { pubkey: config_1.SOLANA_PRICE_ACCOUNT_DEVNET, isSigner: false, isWritable: true },
                    ...allTroves.map(pool => ({ pubkey: pool.accountPubkey, isSigner: false, isWritable: true })),
                    { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                ],
                data: new buffer_1.Buffer([6]),
                programId: config_1.TROVE_PROGRAM_KEY,
            }));
            transaction.feePayer = clientKey;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            return yield __classPrivateFieldGet(this, _Trove_signAndSendTransaction, "f").call(this, transaction);
        });
        _Trove_signAndSendTransaction.set(this, (transaction) => __awaiter(this, void 0, void 0, function* () {
            return (0, utils_1.signAndSendTransaction)(this.connection, this.provider, transaction);
        }));
    }
}
exports.Trove = Trove;
_Trove_getAllTrovesCreator = new WeakMap(), _Trove_getTroveDataAccountInfo = new WeakMap(), _Trove_serializeTroveData = new WeakMap(), _Trove_createTrove = new WeakMap(), _Trove_updateTrove = new WeakMap(), _Trove_troveCreateInstruction = new WeakMap(), _Trove_troveUpdateInstruction = new WeakMap(), _Trove_troveCloseInstruction = new WeakMap(), _Trove_troveLiquidateInstruction = new WeakMap(), _Trove_redemptionInstruction = new WeakMap(), _Trove_signAndSendTransaction = new WeakMap();
