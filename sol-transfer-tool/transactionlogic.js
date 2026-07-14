const {
	address,
	pipe,
	createTransactionMessage,
	setTransactionMessageFeePayerSigner,
	setTransactionMessageLifetimeUsingBlockhash,
	appendTransactionMessageInstruction,
	signTransactionMessageWithSigners,
	getSignatureFromTransaction,
	getBase64EncodedWireTransaction,
	lamports,
} = require("@solana/kit");
const { getTransferSolInstruction } = require("@solana-program/system");

const COMMITMENT_LEVELS = ["processed", "confirmed", "finalized"];

async function waitForCommitment(rpc, signature, targetCommitment) {
	const targetIndex = COMMITMENT_LEVELS.indexOf(targetCommitment);

	while (true) {
		const { value } = await rpc
			.getSignatureStatuses([signature], { searchTransactionHistory: true })
			.send();

		const status = value[0];

		if (status?.err) {
			throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
		}

		if (status) {
			const currentIndex = COMMITMENT_LEVELS.indexOf(status.confirmationStatus);
			if (currentIndex >= targetIndex) break;
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
	}
}

async function transferWithConfirmation(
	rpc,
	signer,
	toAddress,
	amountInSOL,
	statusUpdate = () => {}
) {
	const destination = address(toAddress);
	const lamportAmount = lamports(BigInt(Math.round(amountInSOL * 1_000_000_000)));

	const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

	const transactionMessage = pipe(
		createTransactionMessage({ version: 0 }),
		(tx) => setTransactionMessageFeePayerSigner(signer, tx),
		(tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
		(tx) =>	appendTransactionMessageInstruction(
				getTransferSolInstruction({
					source: signer,
					destination,
					amount: lamportAmount,
				}),
				tx
			)
	);

	const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
	const signature = getSignatureFromTransaction(signedTransaction);
	const wireTransaction = getBase64EncodedWireTransaction(signedTransaction);

	console.log(`\nSending ${amountInSOL} SOL to ${toAddress}...\n`);

	// Step A: Send the transaction
	statusUpdate("Status: Sending transaction...");
	await rpc.sendTransaction(wireTransaction, { encoding: "base64" }).send();

	statusUpdate("Status: Processed (included in a block)...");

	// Step B: Wait for confirmed status
	await waitForCommitment(rpc, signature, "confirmed");
	statusUpdate("Status: Confirmed (supermajority voted)...");

	// Step C: Wait for finalized status
	await waitForCommitment(rpc, signature, "finalized");
	statusUpdate("Status: Finalized (irreversible)");

	console.log("\n");

	return signature;
}

module.exports = { transferWithConfirmation };