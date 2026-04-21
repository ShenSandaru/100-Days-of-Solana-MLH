import {
  createSolanaRpc,
  devnet,
  createKeyPairSignerFromBytes,
  createKeyPairSignerFromPrivateKeyBytes, 
  getBase58Codec,
} from "@solana/kit";
import { readFile, writeFile } from "node:fs/promises";

const WALLET_FILE = "wallet.json";
const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));

async function loadOrCreateWallet() {
  try {
    // Try to load an existing wallet
    const data = JSON.parse(await readFile(WALLET_FILE, "utf-8"));
    const secretBytes = new Uint8Array(data.secretKey);
    const wallet = await createKeyPairSignerFromBytes(secretBytes);
    console.log("Loaded existing wallet:", wallet.address);
    return wallet;
    } catch {
    // No wallet file found, create a new one
    // 1. Generate 32 secure random bytes for the private key
    const privateKeyBytes = crypto.getRandomValues(new Uint8Array(32));
    
    // 2. Create the wallet directly from those 32 bytes
    const wallet = await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    // 3. Export only the public key, which is fully allowed to be exported as 'raw'
    const publicKeyBytes = new Uint8Array(
      await crypto.subtle.exportKey("raw", wallet.keyPair.publicKey)
    );

    // 4. Solana keypair format: 64 bytes (32 private seed + 32 public key)
    const keypairBytes = new Uint8Array(64);
    keypairBytes.set(privateKeyBytes, 0);
    keypairBytes.set(publicKeyBytes, 32);

    await writeFile(
      WALLET_FILE,
      JSON.stringify({ secretKey: Array.from(keypairBytes) })
    );

    console.log("Created new wallet:", wallet.address);
    console.log(`Saved to ${WALLET_FILE}`);
    return wallet;
  }
}

const wallet = await loadOrCreateWallet();

// Check balance
const { value: balance } = await rpc.getBalance(wallet.address).send();
const balanceInSol = Number(balance) / 1_000_000_000;

console.log(`\nAddress: ${wallet.address}`);
console.log(`Balance: ${balanceInSol} SOL`);

if (balanceInSol === 0) {
  console.log(`
\nThis wallet has no SOL. Visit https://faucet.solana.com/ and airdrop some to:
`);
  console.log(wallet.address);
}