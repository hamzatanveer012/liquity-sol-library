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
exports.getOrCreateTokenAccount = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const constants_1 = require("./config/constants");
function getOrCreateTokenAccount(connection, payer, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const [tokenAccountAddress] = yield web3_js_1.PublicKey.findProgramAddress([owner.toBuffer(), spl_token_1.TOKEN_PROGRAM_ID.toBuffer(), constants_1.MINT_KEY.toBuffer()], spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
        const tokenAccount = yield (0, spl_token_1.getAccount)(connection, tokenAccountAddress);
        if (tokenAccount === undefined) {
            try {
                const ix = (0, spl_token_1.createAssociatedTokenAccountInstruction)(payer, tokenAccountAddress, owner, constants_1.MINT_KEY, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
                const transaction = new web3_js_1.Transaction().add(ix);
                yield (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, [this.treasury_wallet]);
            }
            catch (e) {
                console.log(e);
                return undefined;
            }
        }
        return tokenAccountAddress;
    });
}
exports.getOrCreateTokenAccount = getOrCreateTokenAccount;
