import {PublicKey} from "@solana/web3.js";
import {Buffer} from "buffer";

export enum PROGRAM_INSTRUCTION {CREATE,READ,UPDATE,DELETE, LIQUIDATE,TEST}
export enum MODULE_INSTRUCTION {TROVE,STABILITY_POOL}
export const STABILITY_POOL_PROGRAM_KEY = new PublicKey("HeCVWdULtLojN57EyTvYkBSkSCeP5maoeYHfCsbN9htv");
export const TROVE_PROGRAM_KEY = new PublicKey("AkhbZePq3pbfkTtTb5vNE6v41g4cvWAXERKc4fvF6EHy");
export const STABILITY_POOL_PROGRAM_TOKEN_ACCOUNT_KEY = new PublicKey("3Kv9WeuiUjAkpZa8zEivVhtNjk8dBymvMyvaAxUv8BqV");
export const TROVE_PROGRAM_TOKEN_ACCOUNT_KEY = new PublicKey("48My669e8yMXotkSzpHmfXvxRwk7RU9uBffCbLgcAVpb");
export const MINT_KEY = new PublicKey("FVXXhxefYTtF9rd1i6o664eftWf3YYg8YLkwVSrCLHYH");
export const MINT_AUTHORITY_KEY = new PublicKey("2ETp2RfqowkiWd1D55ipDSRypFHhoq3SQn8hGjhtmKZa");
export const STABILITY_POOL_CREATE_INSTRUCTION = new Buffer([PROGRAM_INSTRUCTION.CREATE]);
export const STABILITY_POOL_UPDATE_INSTRUCTION = new Buffer([PROGRAM_INSTRUCTION.UPDATE]);

