"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDEMPTION_INSTRUCTION = exports.TROVE_CLOSE_INSTRUCTION = exports.TROVE_LIQUIDATE_INSTRUCTION = exports.TROVE_UPDATE_INSTRUCTION = exports.TROVE_CREATE_INSTRUCTION = exports.TROVE_PROGRAM_INSTRUCTION = exports.TROVE_OPEN = exports.OPEN_OFFSET = exports.OWNER_OFFSET = void 0;
const buffer_1 = require("buffer");
exports.OWNER_OFFSET = 0;
exports.OPEN_OFFSET = 64;
exports.TROVE_OPEN = new buffer_1.Buffer([1]);
var TROVE_PROGRAM_INSTRUCTION;
(function (TROVE_PROGRAM_INSTRUCTION) {
    TROVE_PROGRAM_INSTRUCTION[TROVE_PROGRAM_INSTRUCTION["CREATE"] = 0] = "CREATE";
    TROVE_PROGRAM_INSTRUCTION[TROVE_PROGRAM_INSTRUCTION["UPDATE"] = 1] = "UPDATE";
    TROVE_PROGRAM_INSTRUCTION[TROVE_PROGRAM_INSTRUCTION["LIQUIDATE"] = 2] = "LIQUIDATE";
    TROVE_PROGRAM_INSTRUCTION[TROVE_PROGRAM_INSTRUCTION["CLOSE"] = 3] = "CLOSE";
    TROVE_PROGRAM_INSTRUCTION[TROVE_PROGRAM_INSTRUCTION["REDEMPTION"] = 4] = "REDEMPTION";
})(TROVE_PROGRAM_INSTRUCTION = exports.TROVE_PROGRAM_INSTRUCTION || (exports.TROVE_PROGRAM_INSTRUCTION = {}));
exports.TROVE_CREATE_INSTRUCTION = new buffer_1.Buffer([TROVE_PROGRAM_INSTRUCTION.CREATE]);
exports.TROVE_UPDATE_INSTRUCTION = new buffer_1.Buffer([TROVE_PROGRAM_INSTRUCTION.UPDATE]);
exports.TROVE_LIQUIDATE_INSTRUCTION = new buffer_1.Buffer([TROVE_PROGRAM_INSTRUCTION.LIQUIDATE]);
exports.TROVE_CLOSE_INSTRUCTION = new buffer_1.Buffer([TROVE_PROGRAM_INSTRUCTION.CLOSE]);
exports.REDEMPTION_INSTRUCTION = new buffer_1.Buffer([TROVE_PROGRAM_INSTRUCTION.REDEMPTION]);