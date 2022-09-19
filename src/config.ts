import {PublicKey} from "@solana/web3.js";

// Connection Configuration
export const DEVNET_CONNECTION_URL = "https://api.devnet.solana.com";
export const MAINNET_CONNECTION_URL = "https://api.mainnet-beta.solana.com";

// Decimal Configuration
export const DECIMALS = 1000000000; // total 9 decimals in token
export const BASE_RATE_DECAY_PER_WEEK = 0.1; // total 9 decimals in token
export const REDEMPTION_FEE_ADDON = 0.5; // total 9 decimals in token

// Mint Configuration
export const MINT_KEY = new PublicKey("AHuyZqq3wfb9wKKZXZPg9H6dDog1KnRwn4GfZXGo2xTa");
export const MINT_AUTHORITY_KEY = new PublicKey("AaZzpqT8P3wLaZRztkhnAcopWpXLhzxMsCw5yGrtCU2c");

// Stability Pool Configuration
export const STABILITY_POOL_PROGRAM_KEY = new PublicKey("CeCsxMV2UEkCp3qM1Fom4mYWhJphgS2JKR4YZRFs62qL");
export const STABILITY_POOL_PROGRAM_PDA_KEY = new PublicKey("2AqyHVrtxBDhWuCJ4CUzjPs8gGVg3GT7HMXLyT3vChj6");
export const STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY = new PublicKey("7bipTLWsZMUdmmMYZ3DV1mCggSw8RUPHvzx2nm85rpW9");
export const STABILITY_POOL_RECORD_ACCOUNT = new PublicKey("2i33A47VpNYXX2RNExgUL3vFVb2vn2vhzWpRz9eCGbfe");

// Trove Configuration
export const TROVE_PROGRAM_KEY = new PublicKey("5EytKBkWexGqD1xjjaHCjS7BjA3UJwLUucS6WoYdgbcV");
export const TROVE_PROGRAM_PDA_KEY = new PublicKey("AaZzpqT8P3wLaZRztkhnAcopWpXLhzxMsCw5yGrtCU2c");
export const TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY = new PublicKey("4Ug28721yZsScHTzGqdxgPT5khZPc1tPbdsoMRSaCoy5");
export const TROVE_RECORD_ACCOUNT = new PublicKey("FcUisrijYzcXc4JScfXRdST8okHKDcrKZXiM7RE6Q2U6");
export const BASE_RATE_ACCOUNT = new PublicKey("GNrvP8NUAAYt6FoLjXWRzxa1F7qiXLkAEwPHLXmMyazZ");
export const RECOVERY_MODE_ACCOUNT = new PublicKey("D7GJrdr7fVgj9dhaXU9oqXwcGGEn4ZTXbpJS86Sqc5T3");

// Solana Configuration
export const SOLANA_PRICE_ACCOUNT_DEVNET = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");
export const SOLANA_PRICE_ACCOUNT_MAINNET = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");

// Decimal Precision Configuration
export const COLLATERAL_DECIMAL = 4;
export const DEPT_DECIMAL = 2;
export const TOTAL_DEPT_DECIMAL = 2;
export const COLLATERAL_RATIO_DECIMAL = 0;
export const LIQUIDATION_RESERVE_DECIMAL = 0;
export const BORROWING_FEE_DECIMAL = 2;
export const DEPOSIT_DECIMAL = 2;
export const STAKE_DECIMAL = 2;
export const POOL_SHARE_DECIMAL = 6;
export const REDEEM_DECIMAL = 2;

// Platform Configuration
export const MINIMUM_COLLATERAL_RATIO = 110; // 110%
export const STABLE_COLLATERAL_RATIO = 150; // 150%
export const MINIMUM_TOTAL_DEPT = 1.1; // 2000 ArbiCoin

// Name Configuration
export const CRYPTO_NAME = "Solana";
export const TOKEN_NAME = "ArbiCoin";
export const TOKEN_QTY_NAME = "ArbiQTY";