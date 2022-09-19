"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.new_stability_pool_instruction = exports.module = void 0;
exports.module = new Buffer([MODULE_INSTRUCTION.STABILITY_POOL]);
const new_stability_pool_instruction = (treasury_pub, stability_pool_acc_pub, program_pub, data) => {
    let instruction_type = new Buffer(u8.length);
    instruction_type.writeUInt8(PROGRAM_INSTRUCTION.CREATE);
    return new TransactionInstruction({
        keys: [
            {
                pubkey: treasury_pub,
                isSigner: true,
                isWritable: false,
            },
            {
                pubkey: stability_pool_acc_pub,
                isSigner: false,
                isWritable: true,
            }
        ],
        data: Buffer.concat([exports.module, instruction_type, data, exports.module]),
        programId: program_pub
    });
};
exports.new_stability_pool_instruction = new_stability_pool_instruction;
