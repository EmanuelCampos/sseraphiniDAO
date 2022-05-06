import { expect } from "chai";
import { ethers, network, waffle } from "hardhat";

import { SSeraphiniGovernance } from "../types/SSeraphiniGovernance";
import { SSeraphiniGovernance__factory } from "../types/factories/SSeraphiniGovernance__factory";

import { SibsToken } from "../types/SibsToken";
import { SibsToken__factory } from "../types/factories/SibsToken__factory";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { utils } from "ethers";

describe("SSeraphini Governance", function () {
  let sibsToken: SibsToken;
  let sseraphiniGovernance: SSeraphiniGovernance;

  let bob: SignerWithAddress;
  let jess: SignerWithAddress;

  async function mineNBlocks(n: any) {
    for (let index = 0; index < n; index++) {
      await network.provider.send("evm_mine");
    }
  }

  beforeEach(async () => {
    // Get the list of accounts
    [bob, jess] = await ethers.getSigners();

    const SibsToken = (await ethers.getContractFactory("SibsToken")) as SibsToken__factory;
    sibsToken = await SibsToken.deploy();

    await sibsToken.deployed();

    const SibeliusGovernance = (await ethers.getContractFactory(
      "SSeraphiniGovernance"
    )) as SSeraphiniGovernance__factory;
    sseraphiniGovernance = await SibeliusGovernance.deploy("SSeraphiniDAO", sibsToken.address, 4, 16, 10);

    await sibsToken.setGovernance(sseraphiniGovernance.address);
    await sseraphiniGovernance.deployed();
  });

  it("Should not be able to call a function without governance", async function () {
    await expect(sibsToken.reward(jess.address, 10)).to.be.revertedWith("Governor: only Governor");
  });

  it("Should not be able to quorum without less than 10% quorum", async function () {
    const balance = await sibsToken.balanceOf(bob.address);

    await sibsToken.transfer(jess.address, balance);
    await sibsToken.delegate(bob.address);

    const targets = [sibsToken.address];
    const values = [0];

    const ABI = ["function reward(address to, uint256 quantity)"];

    const ICrowGovernance = new ethers.utils.Interface(ABI);

    const calldatas = [
      ICrowGovernance.encodeFunctionData("reward", [jess.address, utils.parseUnits("100000", "ether")]),
    ];

    const propose = await sseraphiniGovernance.propose(targets, [0], calldatas, "Reward a user");

    const tx = await propose.wait();

    if (!tx.events) return;

    const event = tx.events[0];

    await mineNBlocks(5);

    await sseraphiniGovernance.castVote(event?.args?.proposalId, 1);

    await mineNBlocks(17);

    await expect(sseraphiniGovernance.execute(targets, [0], calldatas, utils.id("Reward a user"))).to.be.revertedWith(
      "Governor: proposal not successful"
    );
  });

  it("Should able to reward using governance", async function () {
    await sibsToken.delegate(bob.address);

    const targets = [sibsToken.address];

    const ABI = ["function reward(address to, uint256 quantity)"];

    const ICrowGovernance = new ethers.utils.Interface(ABI);

    const calldatas = [
      ICrowGovernance.encodeFunctionData("reward", [jess.address, utils.parseUnits("100000", "ether")]),
    ];

    const propose = await sseraphiniGovernance.propose(targets, [0], calldatas, "Reward a user");

    const tx = await propose.wait();

    if (!tx.events) return;

    const event = tx.events[0];

    await mineNBlocks(5);

    await sseraphiniGovernance.castVote(event?.args?.proposalId, 1);

    await mineNBlocks(17);

    await sseraphiniGovernance.execute(targets, [0], calldatas, utils.id("Reward a user"));

    const jessBalance = await sibsToken.balanceOf(jess.address);

    expect(jessBalance).to.equal(utils.parseUnits("100000", "ether"));
  });
});
