"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StabilityPoolModel = void 0;
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const buffer_layout_1 = require("@solana/buffer-layout");
exports.StabilityPoolModel = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.blob)(32, "owner"),
    (0, buffer_layout_utils_1.u64)('amount'),
    (0, buffer_layout_utils_1.bool)("open"),
]);
