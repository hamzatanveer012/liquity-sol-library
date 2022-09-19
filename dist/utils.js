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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenPriceInUSD = exports.getSolanaPriceInUSD = exports.getOrCreateTokenAccount = exports.signAndSendTransaction = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const config_1 = require("./config");
const axios_1 = __importDefault(require("axios"));
const signAndSendTransaction = (connection, provider, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const signedTransaction = yield (provider === null || provider === void 0 ? void 0 : provider.signTransaction(transaction));
    const signature = yield connection.sendRawTransaction(signedTransaction.serialize());
    yield connection.confirmTransaction(signature);
    return signature;
});
exports.signAndSendTransaction = signAndSendTransaction;
function getOrCreateTokenAccount(connection, provider, payer, owner = undefined) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!owner) {
            owner = payer;
        }
        const [tokenAccountAddress] = yield web3_js_1.PublicKey.findProgramAddress([owner.toBuffer(), spl_token_1.TOKEN_PROGRAM_ID.toBuffer(), config_1.MINT_KEY.toBuffer()], spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
        try {
            const tokenAccount = yield (0, spl_token_1.getAccount)(connection, tokenAccountAddress);
            return Promise.resolve(tokenAccount.address);
        }
        catch (e) {
            try {
                const ix = (0, spl_token_1.createAssociatedTokenAccountInstruction)(payer, tokenAccountAddress, owner, config_1.MINT_KEY, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
                const transaction = new web3_js_1.Transaction().add(ix);
                transaction.feePayer = payer;
                let hash = yield connection.getLatestBlockhash();
                transaction.recentBlockhash = hash.blockhash;
                yield (0, exports.signAndSendTransaction)(connection, provider, transaction);
                return Promise.resolve(tokenAccountAddress);
            }
            catch (e) {
                console.log(e);
            }
        }
        return undefined;
    });
}
exports.getOrCreateTokenAccount = getOrCreateTokenAccount;
function getSolanaPriceInUSD() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield axios_1.default.get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")).data.solana.usd;
    });
}
exports.getSolanaPriceInUSD = getSolanaPriceInUSD;
function getTokenPriceInUSD() {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve(1);
    });
}
exports.getTokenPriceInUSD = getTokenPriceInUSD;
