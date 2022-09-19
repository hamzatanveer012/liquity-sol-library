import {bool, u64} from "@solana/buffer-layout-utils";
import {blob, struct,} from "@solana/buffer-layout";

interface StabilityPoolInterface {
    owner?: Uint8Array;
    amount: bigint;
    open: boolean;
}

export const StabilityPoolModel = struct<StabilityPoolInterface>([
    blob(32, "owner"),
    u64('amount'),
    bool("open"),
]);