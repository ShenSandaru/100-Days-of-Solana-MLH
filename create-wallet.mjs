import { generateKeyPairSigner } from "@solana/kit";
// Generate a brand new keypair
const wallet = await generateKeyPairSigner();

console.log("Your new wallet address:", wallet.address);
console.log('\nThis address is your public key. It’s safe to share.');
console.log("The private key stays in memory. In a real app, you’d save it securely.");