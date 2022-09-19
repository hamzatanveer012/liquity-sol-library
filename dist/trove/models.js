"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRateRecordModel = exports.TroveModel = void 0;
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const buffer_layout_1 = require("@solana/buffer-layout");
exports.TroveModel = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.blob)(32, "owner"),
    (0, buffer_layout_utils_1.u64)('collateral'),
    (0, buffer_layout_utils_1.u64)('dept'),
    (0, buffer_layout_utils_1.u64)('liquidation_reserve'),
    (0, buffer_layout_utils_1.u64)('total_dept'),
    (0, buffer_layout_utils_1.bool)("open"),
]);
exports.BaseRateRecordModel = (0, buffer_layout_1.struct)([
    (0, buffer_layout_utils_1.u64)('base_rate'),
    (0, buffer_layout_utils_1.u64)('timestamp'),
]);
