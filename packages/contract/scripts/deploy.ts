import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const SibeliusGovernance = await ethers.getContractFactory("SibeliusGovernance");
  const sibeliusGovernance = await SibeliusGovernance.deploy();

  console.log("SibeliusGovernance deployed to:", sibeliusGovernance.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
