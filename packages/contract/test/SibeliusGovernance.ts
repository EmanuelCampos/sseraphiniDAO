import { expect } from "chai";
import { ethers } from "hardhat";
// @ts-ignore
import { SibeliusGovernance, SibeliusGovernance__factory } from "../typechain/index.ts";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Sibelius Governance", function () {
  let sibeliusGovernance: SibeliusGovernance;
  let bob: SignerWithAddress;

  beforeEach(async () => {
    // Get the list of accounts
    [bob] = await ethers.getSigners();

    // Deploy Mallards Contract
    const SibeliusGovernance = (await ethers.getContractFactory("SibeliusGovernance")) as SibeliusGovernance__factory;
    sibeliusGovernance = await SibeliusGovernance.deploy();
    await sibeliusGovernance.deployed();
  });

  it("Should be able to do something", async function () {
    await sibeliusGovernance.setSaleState(true);
  });

});
