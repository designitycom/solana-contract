import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contract } from "../target/types/contract";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getMint,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

describe("contract", () => {
  // Configure the client to use the local cluster.
  const env = anchor.AnchorProvider.env();
  anchor.setProvider(env);

  const program = anchor.workspace.Contract as Program<Contract>;

  it("Is initialized!", async () => {
    // Admin initializes the org
    const mint = Keypair.generate();

    const authority = Keypair.generate();
    let airDropTX = await env.connection.requestAirdrop(
      authority.publicKey,
      3 * LAMPORTS_PER_SOL
    );
    let blockhash = await env.connection.getLatestBlockhash({
      commitment: "finalized",
    });
    env.connection.confirmTransaction(
      {
        blockhash: blockhash.blockhash,
        signature: airDropTX,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      },
      "finalized"
    );
    console.log(`Aidropped to ${authority.publicKey.toBase58()}`);

    const orgAddress = PublicKey.findProgramAddressSync(
      [
        Buffer.from("org"),
        mint.publicKey.toBuffer(),
        authority.publicKey.toBuffer(),
      ],
      program.programId
    )[0];
    console.log("Org Address", orgAddress.toBase58());
    // console.log(orgAddress.toBase58(), mint.publicKey.toBase58(), orgKey.publicKey.toBase58())
    // Add your test here.
    const tx = await program.methods
      .createOrganization()
      .accounts({
        org: orgAddress,
        mint: mint.publicKey,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([authority, mint])
      .rpc({
        commitment: "finalized",
        skipPreflight: true,
      });
    console.log("Create Org signature", tx);
    const orgAccount = await program.account.org.fetch(orgAddress);
    console.log("All org data: ", orgAccount);
    // airDropTX = await env.connection.requestAirdrop(
    //   orgAddress,
    //   1 * LAMPORTS_PER_SOL
    // );
    // blockhash = await env.connection.getLatestBlockhash({
    //   commitment: "finalized",
    // });
    // env.connection.confirmTransaction(
    //   {
    //     blockhash: blockhash.blockhash,
    //     signature: airDropTX,
    //     lastValidBlockHeight: blockhash.lastValidBlockHeight,
    //   },
    //   "finalized"
    // );
    // console.log(`Aidropped to ${orgAddress.toBase58()}`);

    // CD applies
    const applicant = Keypair.generate();
    airDropTX = await env.connection.requestAirdrop(
      applicant.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    blockhash = await env.connection.getLatestBlockhash({
      commitment: "finalized",
    });
    env.connection.confirmTransaction(
      {
        blockhash: blockhash.blockhash,
        signature: airDropTX,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      },
      "finalized"
    );
    console.log(`Aidropped to ${applicant.publicKey.toBase58()}`);

    let mintATA = await getOrCreateAssociatedTokenAccount(
      env.connection,
      authority,
      mint.publicKey,
      applicant.publicKey
    );

    console.log("ata", mintATA.address.toBase58(), mintATA.amount);

    const tx1 = await program.methods
      .register()
      .accounts({
        applicant: applicant.publicKey,
        org: orgAddress,
        authority: authority.publicKey,
        mint: mint.publicKey,
        tokenAccount: mintATA.address,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority, applicant])
      .rpc({
        skipPreflight: true,
        commitment: "confirmed",
      });
    console.log("Register signature", tx1);
    mintATA = await getOrCreateAssociatedTokenAccount(
      env.connection,
      authority,
      mint.publicKey,
      applicant.publicKey
    );
    console.log(mintATA.amount);
    // const applicationAccount = await program.account.application.fetch(applicationPDA);
    // console.log("All application data: ", applicationAccount);

    const tx2 = await program.methods
      .makeSource("a", "b", 5)
      .accounts({
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();
    console.log("Sourcing signature", tx2);
    const sourceAddress = PublicKey.findProgramAddressSync(
      [Buffer.from("source"), Buffer.from("a"), Buffer.from("b")],
      program.programId
    )[0];
    const sourceAccount = await program.account.source.fetch(sourceAddress);
    console.log("All source data: ", sourceAccount);

    const tx3 = await program.methods.submitRate(3).accounts({
      applicant: applicant.publicKey,
      mint: mint.publicKey,
      source: sourceAddress,
      org: orgAddress,
      authority: authority.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).signers([authority]).rpc();
    console.log("Rating signature", tx3);

    const ratingAddress = PublicKey.findProgramAddressSync(
      [Buffer.from("rating"), orgAddress.toBuffer(), applicant.publicKey.toBuffer(), sourceAddress.toBuffer()],
      program.programId
    )[0];
    const scoreAccount = await program.account.score.fetch(ratingAddress);
    console.log("All score data: ", scoreAccount);
  });
});
