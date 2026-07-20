const parsed = await rpc
  .getAccountInfo(mintAddress, { encoding: "jsonParsed" })
  .send();

console.log("\n--- RPC jsonParsed Result ---");

// The RPC parses known account types server-side.
// For an SPL Token mint account, the decoded fields live at:
// parsed.value.data.parsed
console.log(JSON.stringify(parsed.value.data.parsed, null, 2));