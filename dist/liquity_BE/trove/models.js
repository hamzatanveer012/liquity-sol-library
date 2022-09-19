"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trove = void 0;
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const buffer_layout_1 = require("@solana/buffer-layout");
exports.Trove = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.blob)(32, "recipient"),
    (0, buffer_layout_utils_1.u64)('sol_received'),
    (0, buffer_layout_utils_1.u64)('coin_transfered'),
    (0, buffer_layout_utils_1.bool)("open"),
    (0, buffer_layout_utils_1.u64)('borrowing_fee_percent'),
    (0, buffer_layout_utils_1.u64)('liquidation_reserve'),
    (0, buffer_layout_utils_1.u64)('total_dept'),
    (0, buffer_layout_1.u8)('account_type'),
]);
