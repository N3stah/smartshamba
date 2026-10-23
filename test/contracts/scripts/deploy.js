// Deploy script for BatchProvenance.sol on Polygon Amoy Testnet
// Usage: npx hardhat run scripts/deploy.js --network amoy

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load .env from project root (parent of test/contracts/)
const envPath = path.join(__dirname, "..", "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  }
}

async function main() {
  const rpcUrl = process.env.AMOY_RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!rpcUrl) throw new Error("AMOY_RPC_URL not set in .env");
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  if (balance === 0n) {
    throw new Error(
      "Deployer wallet has 0 MATIC. Fund it from a faucet first:\n" +
      "  https://faucet.triangleplatform.com/polygon/amoy\n" +
      "  Address: " + deployer.address
    );
  }

  console.log("\nDeploying BatchProvenance...");
  const BatchProvenance = await ethers.getContractFactory("BatchProvenance");
  const contract = await BatchProvenance.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✓ BatchProvenance deployed to:", contractAddress);
  console.log("✓ Authorized writer (deployer):", deployer.address);
  console.log("✓ Transaction hash:", contract.deploymentTransaction()?.hash);

  const authorizedWriter = await contract.authorizedWriter();
  console.log("✓ authorizedWriter() on-chain:", authorizedWriter);
  console.log("✓ Match:", authorizedWriter.toLowerCase() === deployer.address.toLowerCase());

  console.log("\n--- Add to your .env ---");
  console.log(`PROVENANCE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`BLOCKCHAIN_RPC_URL=${rpcUrl}`);
  console.log(`PROVENANCE_SIGNER_PRIVATE_KEY=${privateKey}`);
  console.log(`EXPECTED_CHAIN_ID=80002`);

  console.log("\n--- Verify on block explorer ---");
  console.log(`https://www.oklink.com/amoy/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deploy failed:", error.message);
    process.exit(1);
  });
