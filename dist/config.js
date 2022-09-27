"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_QTY_NAME = exports.TOKEN_NAME = exports.CRYPTO_NAME = exports.MINIMUM_TOTAL_DEPT = exports.STABLE_COLLATERAL_RATIO = exports.MINIMUM_COLLATERAL_RATIO = exports.PRECISION = exports.REDEEM_DECIMAL = exports.POOL_SHARE_DECIMAL = exports.STAKE_DECIMAL = exports.DEPOSIT_DECIMAL = exports.BORROWING_FEE_DECIMAL = exports.LIQUIDATION_RESERVE_DECIMAL = exports.COLLATERAL_RATIO_DECIMAL = exports.TOTAL_DEPT_DECIMAL = exports.DEPT_DECIMAL = exports.COLLATERAL_DECIMAL = exports.SOLANA_PRICE_ACCOUNT_MAINNET = exports.SOLANA_PRICE_ACCOUNT_DEVNET = exports.RECOVERY_MODE_ACCOUNT = exports.BASE_RATE_ACCOUNT = exports.TROVE_RECORD_ACCOUNT = exports.TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY = exports.TROVE_PROGRAM_PDA_KEY = exports.TROVE_PROGRAM_KEY = exports.STABILITY_POOL_RECORD_ACCOUNT = exports.STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY = exports.STABILITY_POOL_PROGRAM_PDA_KEY = exports.STABILITY_POOL_PROGRAM_KEY = exports.MINT_AUTHORITY_KEY = exports.MINT_KEY = exports.REDEMPTION_FEE_ADDON = exports.BASE_RATE_DECAY_PER_WEEK = exports.DECIMALS = exports.MAINNET_CONNECTION_URL = exports.DEVNET_CONNECTION_URL = void 0;
const web3_js_1 = require("@solana/web3.js");
// Connection Configuration
exports.DEVNET_CONNECTION_URL = "https://api.devnet.solana.com";
exports.MAINNET_CONNECTION_URL = "https://api.mainnet-beta.solana.com";
// Decimal Configuration
exports.DECIMALS = 1000000000; // total 9 decimals in token
exports.BASE_RATE_DECAY_PER_WEEK = 0.1; // total 9 decimals in token
exports.REDEMPTION_FEE_ADDON = 0.5; // total 9 decimals in token
// Mint Configuration
exports.MINT_KEY = new web3_js_1.PublicKey("AHuyZqq3wfb9wKKZXZPg9H6dDog1KnRwn4GfZXGo2xTa");
exports.MINT_AUTHORITY_KEY = new web3_js_1.PublicKey("AaZzpqT8P3wLaZRztkhnAcopWpXLhzxMsCw5yGrtCU2c");
// Stability Pool Configuration
exports.STABILITY_POOL_PROGRAM_KEY = new web3_js_1.PublicKey("CeCsxMV2UEkCp3qM1Fom4mYWhJphgS2JKR4YZRFs62qL");
exports.STABILITY_POOL_PROGRAM_PDA_KEY = new web3_js_1.PublicKey("2AqyHVrtxBDhWuCJ4CUzjPs8gGVg3GT7HMXLyT3vChj6");
exports.STABILITY_POOL_PROGRAM_PDA_TOKEN_ACCOUNT_KEY = new web3_js_1.PublicKey("7bipTLWsZMUdmmMYZ3DV1mCggSw8RUPHvzx2nm85rpW9");
exports.STABILITY_POOL_RECORD_ACCOUNT = new web3_js_1.PublicKey("2i33A47VpNYXX2RNExgUL3vFVb2vn2vhzWpRz9eCGbfe");
// Trove Configuration
exports.TROVE_PROGRAM_KEY = new web3_js_1.PublicKey("5EytKBkWexGqD1xjjaHCjS7BjA3UJwLUucS6WoYdgbcV");
exports.TROVE_PROGRAM_PDA_KEY = new web3_js_1.PublicKey("AaZzpqT8P3wLaZRztkhnAcopWpXLhzxMsCw5yGrtCU2c");
exports.TROVE_PROGRAM_PDA_TOKEN_ACCOUNT_KEY = new web3_js_1.PublicKey("4Ug28721yZsScHTzGqdxgPT5khZPc1tPbdsoMRSaCoy5");
exports.TROVE_RECORD_ACCOUNT = new web3_js_1.PublicKey("FcUisrijYzcXc4JScfXRdST8okHKDcrKZXiM7RE6Q2U6");
exports.BASE_RATE_ACCOUNT = new web3_js_1.PublicKey("GNrvP8NUAAYt6FoLjXWRzxa1F7qiXLkAEwPHLXmMyazZ");
exports.RECOVERY_MODE_ACCOUNT = new web3_js_1.PublicKey("D7GJrdr7fVgj9dhaXU9oqXwcGGEn4ZTXbpJS86Sqc5T3");
// Solana Configuration
exports.SOLANA_PRICE_ACCOUNT_DEVNET = new web3_js_1.PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");
exports.SOLANA_PRICE_ACCOUNT_MAINNET = new web3_js_1.PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");
// Decimal Precision Configuration
exports.COLLATERAL_DECIMAL = 4;
exports.DEPT_DECIMAL = 4;
exports.TOTAL_DEPT_DECIMAL = 4;
exports.COLLATERAL_RATIO_DECIMAL = 0;
exports.LIQUIDATION_RESERVE_DECIMAL = 0;
exports.BORROWING_FEE_DECIMAL = 4;
exports.DEPOSIT_DECIMAL = 4;
exports.STAKE_DECIMAL = 4;
exports.POOL_SHARE_DECIMAL = 6;
exports.REDEEM_DECIMAL = 4;
exports.PRECISION = 4;
// Platform Configuration
exports.MINIMUM_COLLATERAL_RATIO = 110; // 110%
exports.STABLE_COLLATERAL_RATIO = 150; // 150%
exports.MINIMUM_TOTAL_DEPT = 1.1; // 2000 ArbiCoin
// Name Configuration
exports.CRYPTO_NAME = "Solana";
exports.TOKEN_NAME = "ArbiCoin";
exports.TOKEN_QTY_NAME = "ArbiQTY";
