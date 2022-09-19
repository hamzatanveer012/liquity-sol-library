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
const constants_1 = require("../common/config/constants");
const publickey_1 = require("@solana/web3.js/src/publickey");
const web3_js_1 = require("@solana/web3.js");
const web3_service_1 = require("../common/web3_service");
const spl_token_1 = require("@solana/spl-token");
const buffer_1 = require("buffer");
const models_1 = require("./models");
exports.module = new buffer_1.Buffer([constants_1.MODULE_INSTRUCTION.STABILITY_POOL]);
class StabilityPool extends web3_service_1.Web3_service {
    constructor() {
        super(...arguments);
        this.createPool = (owner, owner_token_account, amount) => __awaiter(this, void 0, void 0, function* () {
            let instruction_type = new buffer_1.Buffer([constants_1.PROGRAM_INSTRUCTION.CREATE]);
            let data = buffer_1.Buffer.alloc(models_1.StabilityPoolModel.span);
            models_1.StabilityPoolModel.encode({
                pool_provider: new publickey_1.PublicKey(owner).toBuffer(),
                pool_amt: BigInt(amount),
                open: true,
            }, data);
            let stability_pool_acc = web3_js_1.Keypair.generate();
            const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.createAccount({
                fromPubkey: owner,
                newAccountPubkey: stability_pool_acc.publicKey,
                lamports: yield this.connection.getMinimumBalanceForRentExemption(models_1.StabilityPoolModel.span),
                space: models_1.StabilityPoolModel.span,
                programId: constants_1.POOL_PROGRAM_ID
            }), new web3_js_1.TransactionInstruction({
                keys: [
                    { pubkey: owner, isSigner: true, isWritable: false },
                    { pubkey: stability_pool_acc.publicKey, isSigner: false, isWritable: true },
                    { pubkey: owner_token_account, isSigner: true, isWritable: false },
                    { pubkey: constants_1.POOL_PROGRAM_TOKEN_ACC, isSigner: true, isWritable: false },
                    { pubkey: constants_1.MINT, isSigner: false, isWritable: false },
                    { pubkey: constants_1.MINT_AUTHORITY, isSigner: false, isWritable: false },
                    { pubkey: web3_js_1.SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                ],
                data: buffer_1.Buffer.concat([instruction_type, data]),
                programId: constants_1.POOL_PROGRAM_ID
            }));
            transaction.feePayer = owner;
            let hash = yield this.connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            return this.signAndSendTransaction(transaction);
        });
        this.signAndSendTransaction = (transaction) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const signedTransaction = yield ((_a = this.provider) === null || _a === void 0 ? void 0 : _a.signTransaction(transaction));
            const signature = yield this.connection.sendRawTransaction(signedTransaction.serialize());
            return this.connection.confirmTransaction(signature);
        });
    }
}
exports.StabilityPool = StabilityPool;
