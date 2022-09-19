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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StabilityPool = exports.module = void 0;
const web3_js_1 = require("@solana/web3.js");
const web3_service_1 = require("../common/web3_service");
const buffer_1 = require("buffer");
const models_1 = require("./models");
const constants_1 = require("../common/config/constants");
const spl_token_1 = require("@solana/spl-token");
const utils_1 = require("../common/utils");
const bs58_1 = require("bs58");
exports.module = new buffer_1.Buffer([constants_1.MODULE_INSTRUCTION.STABILITY_POOL]);
class StabilityPool extends web3_service_1.Web3_service {
    constructor() {
        super(...arguments);
        this.getTrove = (clientKey) => __awaiter(this, void 0, void 0, function* () {
            const filters = [
                {
                    memcmp: {
                        offset: 0,
                        bytes: clientKey.toBase58()
                    }
                },
                {
                    memcmp: {
                        offset: 40,
                        bytes: (0, bs58_1.encode)(new buffer_1.Buffer([1]))
                    }
                },
            ];
            let stabilityPoolAccount = yield this.connection.getProgramAccounts(constants_1.STABILITY_POOL_PROGRAM_KEY, { filters });
            let buff_to_obj = decode(account.data);
        });
        this.createStabilityPool = (clientKey, tokenAmount) => __awaiter(this, void 0, void 0, function* () {
            let newStabilityPoolAccount = web3_js_1.Keypair.generate();
            const clientTokenAccountKey = yield (0, utils_1.getOrCreateTokenAccount)(this.connection, clientKey, clientKey);
            const transaction = new web3_js_1.Transaction().add(this.stabilityPoolCreateInstruction(clientKey, clientTokenAccountKey, tokenAmount, newStabilityPoolAccount.publicKey));
            transaction.feePayer = clientKey;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            transaction.sign(newStabilityPoolAccount);
            return yield this.signAndSendTransaction(transaction);
        });
        this.updateStabilityPool = (clientKey, tokenAmount, stabilityPoolAccountKey) => __awaiter(this, void 0, void 0, function* () {
            const clientTokenAccountKey = yield (0, utils_1.getOrCreateTokenAccount)(this.connection, clientKey, clientKey);
            const transaction = new web3_js_1.Transaction().add(this.stabilityPoolUpdateInstruction(clientKey, clientTokenAccountKey, tokenAmount, stabilityPoolAccountKey));
            transaction.feePayer = clientKey;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            return yield this.signAndSendTransaction(transaction);
        });
        this.signAndSendTransaction = (transaction) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const signedTransaction = yield ((_a = this.provider) === null || _a === void 0 ? void 0 : _a.signTransaction(transaction));
                const signature = yield this.connection.sendRawTransaction(signedTransaction.serialize());
                yield this.connection.confirmTransaction(signature);
                return signature;
            }
            catch (e) {
                console.log(e);
                console.log(e.logs);
            }
        });
    }
    stabilityPoolCreateInstruction(clientKey, clientTokenAccountKey, tokenAmount, newStabilityPoolAccountKey) {
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
                { pubkey: constants_1.STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true },
                { pubkey: newStabilityPoolAccountKey, isSigner: false, isWritable: true },
                { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            ],
            data: buffer_1.Buffer.concat([constants_1.STABILITY_POOL_CREATE_INSTRUCTION, data]),
            programId: constants_1.STABILITY_POOL_PROGRAM_KEY,
        });
    }
    stabilityPoolUpdateInstruction(clientKey, clientTokenAccountKey, tokenAmount, stabilityPoolAccountKey) {
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
                { pubkey: constants_1.STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY, isSigner: false, isWritable: true },
                { pubkey: stabilityPoolAccountKey, isSigner: false, isWritable: true },
                { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: constants_1.STABILITY_POOL_PROGRAM_KEY, isSigner: false, isWritable: false },
                { pubkey: constants_1.STABILITY_POOL_PROGRAM_PDA_KEY, isSigner: false, isWritable: false },
            ],
            data: buffer_1.Buffer.concat([constants_1.STABILITY_POOL_UPDATE_INSTRUCTION, data]),
            programId: constants_1.STABILITY_POOL_PROGRAM_KEY,
        });
    }
}
exports.StabilityPool = StabilityPool;
