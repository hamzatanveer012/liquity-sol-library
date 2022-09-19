import {Connection} from "@solana/web3.js";

export interface Provider {
    isPhantom: boolean,
    postMessage: (e:any)=>Promise<any>,
    openBridge: (e:any)=>Promise<any>,
    connect: (e:any)=>Promise<any>,
    disconnect:( )=>Promise<any>,
    signTransaction: (e:any)=>Promise<any>,
    signAllTransactions: ( )=>Promise<any>,
    signMessage: (e:any)=>Promise<any>,
    signAndSendTransaction: (e:any)=>Promise<any>,
    request: (e:any)=>Promise<any>,
}

export class Web3Service {
    connection: Connection;
    provider: Provider

    constructor(connection: Connection, provider: Provider) {
        this.connection = connection;
        this.provider = provider;
    }
}