import {Connection, PublicKey, Transaction} from "@solana/web3.js";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAccount,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import {MINT_KEY} from "./config";
import axios from "axios";
import {Provider} from "./web3Service";


export const signAndSendTransaction = async (connection: Connection, provider: Provider, transaction: Transaction) => {
    const signedTransaction = await provider?.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    await connection.confirmTransaction(signature);
    return signature;
}

export async function getOrCreateTokenAccount(connection: Connection, provider: Provider, payer: PublicKey, owner: PublicKey = undefined): Promise<PublicKey> {
    if (!owner) {
        owner = payer;
    }
    const [tokenAccountAddress] = await PublicKey.findProgramAddress(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT_KEY.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    try {
        const tokenAccount = await getAccount(connection, tokenAccountAddress);
        return Promise.resolve(tokenAccount.address);
    } catch (e) {
        try {
            const ix = createAssociatedTokenAccountInstruction(
                payer,
                tokenAccountAddress,
                owner,
                MINT_KEY,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            )
            const transaction = new Transaction().add(ix);
            transaction.feePayer = payer;
            let hash = await connection.getLatestBlockhash();
            transaction.recentBlockhash = hash.blockhash;
            await signAndSendTransaction(connection, provider, transaction)
            return Promise.resolve(tokenAccountAddress);
        } catch (e) {
            console.log(e);
        }
    }
    return undefined;

}

export async function getSolanaPriceInUSD() {
    return (await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")).data.solana.usd;
}

export async function getTokenPriceInUSD() {
    return Promise.resolve(1);
}

