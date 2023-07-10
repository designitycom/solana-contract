import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import {readFileSync} from "fs";
import path from 'path';

const lo = require("buffer-layout");
// const BN = require("bn.js");



/**
 * Vars
 */

const SOLANA_NETWORK = "devnet";

let connection: Connection;
let programKeypair: Keypair;
let programId: PublicKey;

let ashKeypair: Keypair;
let hassanKeypair: Keypair;
let shimaKeypair: Keypair;



/**
 * Helper functions.
 */

function createKeypairFromFile(path: string): Keypair {
    return Keypair.fromSecretKey(
        Buffer.from(JSON.parse(readFileSync(path, "utf-8")))
    )
}


/**
 * Here we are sending lamports using the Rust program we wrote.
 * So this looks familiar. We're just hitting our program with the proper instructions.
 */
async function sendLamports(from: Keypair, to: PublicKey, amount: number) {
    
    let data = Buffer.alloc(8) // 8 bytes
    // lo.ns64("value").encode(new BN(amount), data);
    lo.ns64("value").encode(amount, data);

    let ins = new TransactionInstruction({
        keys: [
            {pubkey: from.publicKey, isSigner: true, isWritable: true},
            {pubkey: to, isSigner: false, isWritable: true},
            {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
        ],
        programId: programId,
        data: data,
    })

    await sendAndConfirmTransaction(
        connection, 
        new Transaction().add(ins), 
        [from]
    );
}



/**
 * Main
 */

async function main() {
    
    connection = new Connection(
        `http://127.0.0.1:8899`, 'confirmed'
    );

    programKeypair = createKeypairFromFile(
        path.join(
            path.resolve(__dirname, '../_dist/program'), 
            'program-keypair.json'
        )
    );
    programId = programKeypair.publicKey;

    // Our sample members are Ringo, George, Paul & John.
    ashKeypair = createKeypairFromFile(__dirname + "/../accounts/ash.json");
    shimaKeypair = createKeypairFromFile(__dirname + "/../accounts/shima.json");
    hassanKeypair = createKeypairFromFile(__dirname + "/../accounts/hassan.json");
    
    // We'll start by airdropping some lamports to Paul & John.
    // await connection.confirmTransaction(
    //     await connection.requestAirdrop(
    //         paulKeypair.publicKey,
    //         LAMPORTS_PER_SOL,
    //     )
    // );
    // await connection.confirmTransaction(
    //     await connection.requestAirdrop(
    //         johnKeypair.publicKey,
    //         LAMPORTS_PER_SOL,
    //     )
    // );

    // shima sends some SOL to ash.
    console.log("shima sends some SOL to ash...");
    console.log(`   shima's public key: ${shimaKeypair.publicKey}`);
    console.log(`   ash's public key: ${ashKeypair.publicKey}`);
    await sendLamports(shimaKeypair, ashKeypair.publicKey, 500000000);

    // ash sends some SOL to hassan.
    console.log("ash sends some SOL to hassan...");
    console.log(`   ash's public key: ${ashKeypair.publicKey}`);
    console.log(`   hassan's public key: ${hassanKeypair.publicKey}`);
    await sendLamports(ashKeypair, hassanKeypair.publicKey, 4000000);

    // hassan sends some SOL over to shima.
    console.log("hassan sends some SOL over to shima...");
    console.log(`   hassan's public key: ${hassanKeypair.publicKey}`);
    console.log(`   shima's public key: ${shimaKeypair.publicKey}`);
    await sendLamports(hassanKeypair, shimaKeypair.publicKey, 2000000);
}


main().then(
    () => process.exit(),
    err => {
        console.error(err);
        process.exit(-1);
    },
  );