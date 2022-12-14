"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINT_AUTHORITY = exports.MINT = exports.TROVE_PROGRAM_TOKEN_ACC = exports.POOL_PROGRAM_TOKEN_ACC = exports.TROVE_PROGRAM_ID = exports.POOL_PROGRAM_ID = exports.MODULE_INSTRUCTION = exports.PROGRAM_INSTRUCTION = void 0;
const web3_js_1 = require("@solana/web3.js");
var PROGRAM_INSTRUCTION;
(function (PROGRAM_INSTRUCTION) {
    PROGRAM_INSTRUCTION[PROGRAM_INSTRUCTION["CREATE"] = 0] = "CREATE";
    PROGRAM_INSTRUCTION[PROGRAM_INSTRUCTION["READ"] = 1] = "READ";
    PROGRAM_INSTRUCTION[PROGRAM_INSTRUCTION["UPDATE"] = 2] = "UPDATE";
    PROGRAM_INSTRUCTION[PROGRAM_INSTRUCTION["DELETE"] = 3] = "DELETE";
    PROGRAM_INSTRUCTION[PROGRAM_INSTRUCTION["LIQUIDATE"] = 4] = "LIQUIDATE";
    PROGRAM_INSTRUCTION[PROGRAM_INSTRUCTION["TEST"] = 5] = "TEST";
})(PROGRAM_INSTRUCTION = exports.PROGRAM_INSTRUCTION || (exports.PROGRAM_INSTRUCTION = {}));
var MODULE_INSTRUCTION;
(function (MODULE_INSTRUCTION) {
    MODULE_INSTRUCTION[MODULE_INSTRUCTION["TROVE"] = 0] = "TROVE";
    MODULE_INSTRUCTION[MODULE_INSTRUCTION["STABILITY_POOL"] = 1] = "STABILITY_POOL";
})(MODULE_INSTRUCTION = exports.MODULE_INSTRUCTION || (exports.MODULE_INSTRUCTION = {}));
exports.POOL_PROGRAM_ID = new web3_js_1.PublicKey("78xvchx7HMfir9K2RZaRcZ55zoSR5XAEhEXQFYPU3NYe");
exports.TROVE_PROGRAM_ID = new web3_js_1.PublicKey("AkhbZePq3pbfkTtTb5vNE6v41g4cvWAXERKc4fvF6EHy");
exports.POOL_PROGRAM_TOKEN_ACC = new web3_js_1.PublicKey("ALe4P8CqkkCp7fkpjr8fchLKvrJPTz3K4Ua3B5Rw4qJX");
exports.TROVE_PROGRAM_TOKEN_ACC = new web3_js_1.PublicKey("48My669e8yMXotkSzpHmfXvxRwk7RU9uBffCbLgcAVpb");
exports.MINT = new web3_js_1.PublicKey("5HkqcNwGPk2gX1AnScbbkit1JCEwiGb39c5DZuCf7m2s");
exports.MINT_AUTHORITY = new web3_js_1.PublicKey("2ETp2RfqowkiWd1D55ipDSRypFHhoq3SQn8hGjhtmKZa");
