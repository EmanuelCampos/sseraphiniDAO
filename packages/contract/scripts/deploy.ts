import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const SSeraphiniGovernance = await ethers.getContractFactory("SSeraphiniGovernance");
  const sseraphiniGovernance = await SSeraphiniGovernance.deploy();
  await sseraphiniGovernance.deployed();

  const SibsToken = await ethers.getContractFactory("SibsToken");
  const sibsToken = await SibsToken.deploy(sseraphiniGovernance.address);
  await sibsToken.deployed();

  console.log("SSeraphiniGovernance deployed to:", sseraphiniGovernance.address);
  console.log("SibsToken deployed to:", sibsToken.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
