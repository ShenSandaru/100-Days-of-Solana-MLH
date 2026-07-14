import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { homedir } from "node:os";
import transactionLogic from "./transactionlogic.js";
import {
	address,
	createKeyPairSignerFromBytes,
	createSolanaRpc,
	createSolanaRpcSubscriptions,
	lamports,
	devnet,
} from "@solana/kit";

const { transferWithConfirmation } = transactionLogic;

// --- Configuration ---
const RPC_URL = devnet("https://api.devnet.solana.com");
const WS_URL = devnet("wss://api.devnet.solana.com");
const LAMPORTS_PER_SOL = 1_000_000_000n;

// --- Parse command-line arguments ---
const args = process.argv.slice(2);
if (args.length < 2) {
	console.error("Usage: node transfer.mjs <RECIPIENT_ADDRESS> <AMOUNT_IN_SOL>");
	console.error("Example: node transfer.mjs GrAkKfEpTKQuVHG2Y97Y2FF4i7y7Q5AHLK94JBy7Y5yv 0.1");
	process.exit(1);
}

const recipientAddress = address(args[0]);
const solAmount = parseFloat(args[1]);

if (isNaN(solAmount) || solAmount <= 0) {
	console.error("Error: Amount must be a positive number.");
	process.exit(1);
}

const transferLamports = lamports(BigInt(Math.round(solAmount * Number(LAMPORTS_PER_SOL))));

// --- Load your keypair from the default Solana CLI location ---
async function loadKeypair() {
	const keypairPath = resolve(homedir(), ".config", "solana", "id.json");
	const secretKeyJson = await readFile(keypairPath, "utf-8");
	const secretKeyBytes = new Uint8Array(JSON.parse(secretKeyJson));
	const keyPair = await createKeyPairSignerFromBytes(secretKeyBytes);
	return keyPair;
}

// --- Main function ---
async function main() {
	console.log("Solana Transfer Tool");
	console.log("====================\n");

	// 1. Connect to devnet
	const rpc = createSolanaRpc(RPC_URL);
	const rpcSubscriptions = createSolanaRpcSubscriptions(WS_URL);
	console.log("Connected to Solana devnet.\n");

	// 2. Load the sender keypair
	const sender = await loadKeypair();
	console.log("Sender:", sender.address);
	console.log("Recipient:", recipientAddress.toString());
	console.log("Amount:", solAmount, "SOL\n");

	// 3. Check the sender's balance
	const { value: balance } = await rpc.getBalance(sender.address).send();
	const balanceInSol = Number(balance) / Number(LAMPORTS_PER_SOL);
	console.log(`Sender balance: ${balanceInSol} SOL`);

	if (balance < transferLamports) {
		console.error(
			`\nInsufficient funds. You need at least ${solAmount} SOL plus a small fee.`
		);
		console.error("Get more devnet SOL at https://faucet.solana.com/");
		process.exit(1);
	}
	try {
		const signature = await transferWithConfirmation(
		rpc,
		sender,
		recipientAddress,
		solAmount,
		statusUpdate
		);
		console.log("Transaction successful!");
		console.log(`Signature: ${signature}`);
		console.log(`View on Solana Explorer:`);
		console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
		console.log("Transaction confirmed!\n");
		console.log("Signature:", signature);
		console.log(`Explorer:  https://explorer.solana.com/tx/${signature}?cluster=devnet`);
	} catch (error) {
		console.error("\nTransaction failed:");
		console.error(error.message);
		process.exit(1);
	}


}

function statusUpdate(message) {
	process.stdout.clearLine(0);
	process.stdout.cursorTo(0);
	process.stdout.write(message);
}

main().catch((err) => {
	console.error("\nTransfer failed:", err.message);
	process.exit(1);
});