import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
    createKeypairFromFile,
} from './util';
import fs from 'mz/fs';
import os from 'os';
import path from 'path';
import yaml from 'yaml';


// Path to local Solana CLI config file.
const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    '.config',
    'solana',
    'cli',
    'config.yml',
);


export async function main() {

    const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
    console.log(`Successfully connected to Solana dev net.`);

    console.log(CONFIG_FILE_PATH);
    const configYml = await fs.readFile(CONFIG_FILE_PATH, {encoding: 'utf8'});
    console.log(configYml);
    const keypairPath = await yaml.parse(configYml).keypair_path;
    const wallet = await createKeypairFromFile(keypairPath);
    console.log(keypairPath);
    console.log(`Local account loaded successfully.`);

    const programKeypair = await createKeypairFromFile(
        path.join(
            path.resolve(__dirname, './dist/program'), 
            'mint-keypair.json'
    ));
    console.log("1");
    const programId = programKeypair.publicKey;
    console.log("2");
    console.log(`Program ID: ${programId.toBase58()}`);
    console.log("3");

    // Derive the mint address and the associated token account address

    const mintKeypair: Keypair = Keypair.generate();
    const tokenAddress = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      wallet.publicKey
    );
    console.log(`New token: ${mintKeypair.publicKey}`);

    // Transact with our program

    const instruction = new TransactionInstruction({
        keys: [
            // Mint account
            {
                pubkey: mintKeypair.publicKey,
                isSigner: true,
                isWritable: true,
            },
            // Token account
            {
                pubkey: tokenAddress,
                isSigner: false,
                isWritable: true,
            },
            // Mint Authority
            {
                pubkey: wallet.publicKey,
                isSigner: true,
                isWritable: false,
            },
            // Rent account
            {
                pubkey: SYSVAR_RENT_PUBKEY,
                isSigner: false,
                isWritable: false,
            },
            // System program
            {
                pubkey: SystemProgram.programId,
                isSigner: false,
                isWritable: false,
            },
            // Token program
            {
                pubkey: TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
            },
            // Associated token program
            {
                pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
            },
        ],
        programId: programId,
        data: Buffer.alloc(0),
    })
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [wallet, mintKeypair],
    )
}

main().then(
    () => process.exit(),
    err => {
      console.error(err);
      process.exit(-1);
    },
  );