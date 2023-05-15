import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contract } from "../target/types/contract";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, } from "@solana/web3.js";

describe("contract", () => {
  // Configure the client to use the local cluster.
  const env = anchor.AnchorProvider.env()
  anchor.setProvider(env);

  const program = anchor.workspace.Contract as Program<Contract>;

  it("Is initialized!", async () => {
    // Admin initializes the org
    const orgKey = Keypair.generate();
    const org = Keypair.generate();

    // Add your test here.
    const tx = await program.methods.initialize().accounts({
      orgKey: orgKey.publicKey,
      org: org.publicKey,
      payer: anchor.getProvider().publicKey,
      systemProgram: SystemProgram.programId
    }).signers([org]).rpc({
      commitment: "processed",
    });
    console.log("Create Org signature", tx);
    const orgAccount = await program.account.org.fetch(org.publicKey);
    console.log("All org data: ", orgAccount);

    // CD applies
    const applicant = Keypair.generate();
    const airDropTX = await env.connection.requestAirdrop(applicant.publicKey, 1 * LAMPORTS_PER_SOL);
    const blockhash = await env.connection.getLatestBlockhash({
      commitment: "finalized",
    });
    env.connection.confirmTransaction({
      blockhash: blockhash.blockhash,
      signature: airDropTX,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }, "finalized");
    console.log(`Aidropped to ${applicant.publicKey.toBase58()}`);

    const [applicationPDA, _] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode('org-applications'),
        org.publicKey.toBuffer(),
        applicant.publicKey.toBuffer(),
      ],
      program.programId
    )
    const tx1 = await program.methods.apply().accounts({
      applicant: applicant.publicKey,
      org: org.publicKey,
      application: applicationPDA,
      systemProgram: SystemProgram.programId
    }).signers([applicant]).rpc({
      skipPreflight: true,
      commitment: "processed"
    });
    console.log("Apply signature", tx1);
    const applicationAccount = await program.account.application.fetch(applicationPDA);
    console.log("All application data: ", applicationAccount);

  });
});
