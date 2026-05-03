
import { createSolanaRpc, devnet, mainnet, address } from "@solana/kit";
// Two separate RPC connections: one for devnet, one for mainnet
const devnetRpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));
const mainnetRpc = createSolanaRpc(
  mainnet("https://api.mainnet-beta.solana.com")
);
// The Token-2022 program exists on both networks
const targetAddress = address(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);
async function getNetworkData(rpc, networkName) {
  const { value: balanceInLamports } = await rpc
    .getBalance(targetAddress)
    .send();
  const balanceInSol = Number(balanceInLamports) / 1_000_000_000;
  const signatures = await rpc
    .getSignaturesForAddress(targetAddress, { limit: 3 })
    .send();
  console.log(`\n--- ${networkName} ---`);
  console.log(`Address : ${targetAddress}`);
  console.log(`Balance : ${balanceInSol} SOL`);
  console.log(`Recent transactions: ${signatures.length}`);
  for (const tx of signatures) {
    const time = tx.blockTime
      ? new Date(Number(tx.blockTime) * 1000).toLocaleString()
      : "unknown";
    console.log(`  ${tx.signature.slice(0, 20)}...  slot ${tx.slot}  ${time}`);
  }
}
await getNetworkData(devnetRpc, "Devnet");
await getNetworkData(mainnetRpc, "Mainnet");
console.log("\n--- Summary ---");
console.log(
  "Same address, same RPC calls, different networks, different data."
);
