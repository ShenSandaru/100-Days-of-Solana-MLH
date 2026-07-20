import { getMintDecoder } from "@solana-program/token";

// The Mint decoder knows exactly how the Token Program structures mint accounts.
// This is the ergonomic path: one decoder call turns raw bytes into a structured object.
const mintDecoder = getMintDecoder();
const mint = mintDecoder.decode(dataBytes);

console.log("\n--- Decoded Mint Account ---");

console.log(
  "Mint Authority:",
  mint.mintAuthority.__option === "Some" ? mint.mintAuthority.value : "None"
);

console.log("Supply:", mint.supply.toString());
console.log("Decimals:", mint.decimals);
console.log("Is Initialized:", mint.isInitialized);

console.log(
  "Freeze Authority:",
  mint.freezeAuthority.__option === "Some" ? mint.freezeAuthority.value : "None"
);