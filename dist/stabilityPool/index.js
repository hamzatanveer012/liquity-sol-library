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
var _StabilityPool_instances, _StabilityPool_getStabilityPoolDataAccountInfo, _StabilityPool_serializeStabilityPoolData, _StabilityPool_createStabilityPool, _StabilityPool_updateStabilityPool, _StabilityPool_stabilityPoolCreateInstruction, _StabilityPool_stabilityPoolUpdateInstruction, _StabilityPool_signAndSendTransaction;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StabilityPool = void 0;
const web3_js_1 = require("@solana/web3.js");
const buffer_1 = require("buffer");
const models_1 = require("./models");
const spl_token_1 = require("@solana/spl-token");
const bs58_1 = require("bs58");
const constants_1 = require("./constants");
const web3Service_1 = require("../web3Service");
const config_1 = require("../config");
const utils_1 = require("../utils");
class StabilityPool extends web3Service_1.Web3Service {
    constructor() {
        super(...arguments);
        _StabilityPool_instances.add(this);
        this.getStabilityPool = (clientKey) => __awaiter(this, void 0, void 0, function* () {
            const filters = [
                { memcmp: { offset: constants_1.OWNER_OFFSET, bytes: clientKey.toBase58() } },
                { memcmp: { offset: constants_1.OPEN_OFFSET, bytes: (0, bs58_1.encode)(constants_1.STABILITY_POOL_OPEN) } },
            ];
            return __classPrivateFieldGet(this, _StabilityPool_getStabilityPoolDataAccountInfo, "f").call(this, clientKey, filters);
        });
        this.getAllStabilityPoolProviders = () => __awaiter(this, void 0, void 0, function* () {
            const filters = [
                { memcmp: { offset: constants_1.OPEN_OFFSET, bytes: (0, bs58_1.encode)(constants_1.STABILITY_POOL_OPEN) } },
            ];
            const accounts = yield this.connection.getProgramAccounts(config_1.STABILITY_POOL_PROGRAM_KEY, { filters });
            return accounts.map((account) => ({
                accountPubkey: account.pubkey,
                ownerPubkey: __classPrivateFieldGet(this, _StabilityPool_serializeStabilityPoolData, "f").call(this, account.pubkey, account.account.data).owner
            }));
        });
        this.getTotalTokensInStabilityPool = () => __awaiter(this, void 0, void 0, function* () {
            const tokensInStabilityPool = yield this.connection.getTokenAccountBalance(config_1.STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY);
            return Number(tokensInStabilityPool.value.amount) / web3_js_1.LAMPORTS_PER_SOL;
        });
        this.depositInStabilityPool = (clientKey, tokenAmount) => __awaiter(this, void 0, void 0, function* () {
            const filters = [
                { memcmp: { offset: constants_1.OWNER_OFFSET, bytes: clientKey.toBase58() } },
            ];
            const stabilityPoolDataAccountInfo = yield __classPrivateFieldGet(this, _StabilityPool_getStabilityPoolDataAccountInfo, "f").call(this, clientKey, filters);
            const amount = tokenAmount * config_1.DECIMALS;
            if (!stabilityPoolDataAccountInfo) {
                if (tokenAmount === 0) {
                    throw new Error('Deposit must be greater than 0');
                }
                return yield __classPrivateFieldGet(this, _StabilityPool_createStabilityPool, "f").call(this, clientKey, amount);
            }
            else {
                if (stabilityPoolDataAccountInfo["amount"] === amount) {
                    throw new Error('Stability Pool deposit amount is unchanged');
                }
                return yield __classPrivateFieldGet(this, _StabilityPool_updateStabilityPool, "f").call(this, clientKey, amount, stabilityPoolDataAccountInfo.dataAccountPublicKey);
            }
        });
        _StabilityPool_getStabilityPoolDataAccountInfo.set(this, (clientKey, filters) => __awaiter(this, void 0, void 0, function* () {
            const accounts = yield this.connection.getProgramAccounts(config_1.STABILITY_POOL_PROGRAM_KEY, { filters });
            if (accounts.length === 0) {
                return null;
            }
            return __classPrivateFieldGet(this, _StabilityPool_serializeStabilityPoolData, "f").call(this, accounts[0].pubkey, accounts[0].account.data);
        }));
        _StabilityPool_serializeStabilityPoolData.set(this, (publicKey, accountData) => {
            let stabilityPoolData = models_1.StabilityPoolModel.decode(accountData);
            let serialized_data = Object.keys(stabilityPoolData).reduce((data, key) => {
                switch (key) {
                    case "owner":
                        data["owner"] = new web3_js_1.PublicKey(stabilityPoolData["owner"]);
                        break;
                    case "amount":
                        const amount = parseInt(stabilityPoolData["amount"].toString());
                        data["amount"] = Number((amount / config_1.DECIMALS).toFixed(config_1.DEPOSIT_DECIMAL));
                        data["amountBigInt"] = amount;
                        break;
                    default:
                        data[key] = stabilityPoolData[key];
                }
                return data;
            }, {});
            serialized_data.dataAccountPublicKey = publicKey;
            return serialized_data;
        });
        _StabilityPool_createStabilityPool.set(this, (clientKey, tokenAmount) => __awaiter(this, void 0, void 0, function* () {
            let newStabilityPoolDataAccount = web3_js_1.Keypair.generate();
            const clientTokenAccountKey = yield (0, utils_1.getOrCreateTokenAccount)(this.connection, this.provider, clientKey, clientKey);
            const transaction = new web3_js_1.Transaction().add(__classPrivateFieldGet(this, _StabilityPool_instances, "m", _StabilityPool_stabilityPoolCreateInstruction).call(this, clientKey, clientTokenAccountKey, tokenAmount, newStabilityPoolDataAccount.publicKey));
            transaction.feePayer = clientKey;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            transaction.sign(newStabilityPoolDataAccount);
            return yield __classPrivateFieldGet(this, _StabilityPool_signAndSendTransaction, "f").call(this, transaction);
        }));
        _StabilityPool_updateStabilityPool.set(this, (clientKey, tokenAmount, stabilityPoolDataAccountKey) => __awaiter(this, void 0, void 0, function* () {
            const clientTokenAccountKey = yield (0, utils_1.getOrCreateTokenAccount)(this.connection, this.provider, clientKey, clientKey);
            const transaction = new web3_js_1.Transaction().add(__classPrivateFieldGet(this, _StabilityPool_instances, "m", _StabilityPool_stabilityPoolUpdateInstruction).call(this, clientKey, clientTokenAccountKey, tokenAmount, stabilityPoolDataAccountKey));
            transaction.feePayer = clientKey;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            return yield __classPrivateFieldGet(this, _StabilityPool_signAndSendTransaction, "f").call(this, transaction);
        }));
        _StabilityPool_signAndSendTransaction.set(this, (transaction) => __awaiter(this, void 0, void 0, function* () {
            return (0, utils_1.signAndSendTransaction)(this.connection, this.provider, transaction);
        }));
    }
}
exports.StabilityPool = StabilityPool;
_StabilityPool_getStabilityPoolDataAccountInfo = new WeakMap(), _StabilityPool_serializeStabilityPoolData = new WeakMap(), _StabilityPool_createStabilityPool = new WeakMap(), _StabilityPool_updateStabilityPool = new WeakMap(), _StabilityPool_signAndSendTransaction = new WeakMap(), _StabilityPool_instances = new WeakSet(), _StabilityPool_stabilityPoolCreateInstruction = function _StabilityPool_stabilityPoolCreateInstruction(clientKey, clientTokenAccountKey, tokenAmount, stabilityPoolDataAccountKey) {
    let data = buffer_1.Buffer.alloc(models_1.StabilityPoolModel.span);
    models_1.StabilityPoolModel.encode({
        owner: clientKey.toBuffer(),
        amount: BigInt(tokenAmount),
        open: true,
    }, data);
    return new web3_js_1.TransactionInstruction({
        keys: [
            { pubkey: clientKey, isSigner: true, isWritable: true },
            { pubkey: clientTokenAccountKey, isSigner: false, isWritable: true },
            { pubkey: config_1.STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true },
            { pubkey: stabilityPoolDataAccountKey, isSigner: false, isWritable: true },
            { pubkey: config_1.STABILITY_POOL_RECORD_ACCOUNT, isSigner: false, isWritable: true },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: buffer_1.Buffer.concat([constants_1.STABILITY_POOL_CREATE_INSTRUCTION, data]),
        programId: config_1.STABILITY_POOL_PROGRAM_KEY,
    });
}, _StabilityPool_stabilityPoolUpdateInstruction = function _StabilityPool_stabilityPoolUpdateInstruction(clientKey, clientTokenAccountKey, tokenAmount, stabilityPoolDataAccountKey) {
    let data = buffer_1.Buffer.alloc(models_1.StabilityPoolModel.span);
    models_1.StabilityPoolModel.encode({
        owner: clientKey.toBuffer(),
        amount: BigInt(tokenAmount),
        open: true,
    }, data);
    return new web3_js_1.TransactionInstruction({
        keys: [
            { pubkey: clientKey, isSigner: true, isWritable: true },
            { pubkey: clientTokenAccountKey, isSigner: false, isWritable: true },
            { pubkey: config_1.STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true },
            { pubkey: stabilityPoolDataAccountKey, isSigner: false, isWritable: true },
            { pubkey: config_1.STABILITY_POOL_PROGRAM_PDA_KEY, isSigner: false, isWritable: false },
            { pubkey: config_1.STABILITY_POOL_RECORD_ACCOUNT, isSigner: false, isWritable: true },
            { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: buffer_1.Buffer.concat([constants_1.STABILITY_POOL_UPDATE_INSTRUCTION, data]),
        programId: config_1.STABILITY_POOL_PROGRAM_KEY,
    });
};
