import { createSolanaRpc, devnet, address } from "@solana/kit";

const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));

// 1. Replace the string below with the public key you got from create-wallet.mjs
const myFundedAddress = address("4U993fdEDk9Jz9A9vm25VuTyfTzTptzYTTW9PLoFZzVD"); 

console.log("Checking balance for:", myFundedAddress);

// 2. We use myFundedAddress instead of wallet.address
const { value: balance } = await rpc.getBalance(myFundedAddress).send();

const balanceInSol = Number(balance) / 1_000_000_000;
console.log(`Balance: ${balanceInSol} SOL`);