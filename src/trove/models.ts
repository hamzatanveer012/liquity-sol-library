import {bool, u64} from "@solana/buffer-layout-utils";
import {blob, f64, struct} from "@solana/buffer-layout";

interface TroveInterface {
    owner?: Uint8Array;
    collateral: bigint;
    dept: bigint;
    borrowing_fee_percent?: number;
    liquidation_reserve?: bigint;
    total_dept?: bigint;
    open?: boolean;
}

export const TroveModel = struct<TroveInterface>([
    blob(32, "owner"),
    u64('collateral'),
    u64('dept'),
    u64('liquidation_reserve'),
    u64('total_dept'),
    bool("open"),
]);


interface BaseRateRecord {
    base_rate: bigint;
    timestamp: bigint;
}

export const BaseRateRecordModel = struct<BaseRateRecord>([
    u64('base_rate'),
    u64('timestamp'),
]);