import { expect } from "chai";
import { ethers, network, waffle } from "hardhat";

import { GovernorWithTwoTokens } from "../types/GovernorWithTwoTokens";
import { GovernorWithTwoTokens__factory } from "../types/factories/GovernorWithTwoTokens__factory";

import { TokenOne } from "../types/TokenOne";
import { TokenOne__factory } from "../types/factories/TokenOne__factory";

import { TokenTwo } from "../types/TokenTwo";
import { TokenTwo__factory } from "../types/factories/TokenTwo__factory";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { utils } from "ethers";

describe("SSeraphini Governance", function () {
  let tokenOne: TokenOne;
  let tokenTwo: TokenTwo;
  let governorWithTwoTokens: GovernorWithTwoTokens;

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

    const TokenOne = (await ethers.getContractFactory("TokenOne")) as TokenOne__factory;
    tokenOne = await TokenOne.deploy();

    const TokenTwo = (await ethers.getContractFactory("TokenTwo")) as TokenTwo__factory;
    tokenTwo = await TokenTwo.deploy();

    await tokenOne.deployed();
    await tokenTwo.deployed();

    const GovernorWithTwoTokens = (await ethers.getContractFactory(
      "GovernorWithTwoTokens"
    )) as GovernorWithTwoTokens__factory;

    governorWithTwoTokens = await GovernorWithTwoTokens.deploy(
      "GovernorWithTwoERC20",
      [tokenOne.address, tokenTwo.address],
      4,
      16,
      10
    );
    await governorWithTwoTokens.deployed();

    await tokenOne.setGovernance(governorWithTwoTokens.address);
  });

  it("Should not be able to call a function without governance", async function () {
    await expect(tokenOne.reward(jess.address, 10)).to.be.revertedWith("Governor: only Governor");
  });

  it("Should not be able to quorum without less than 10% quorum", async function () {
    const balance = await tokenOne.balanceOf(bob.address);

    await tokenOne.transfer(jess.address, balance);
    await tokenOne.delegate(bob.address);

    const targets = [tokenOne.address];
    const values = [0];

    const ABI = ["function reward(address to, uint256 quantity)"];

    const ICrowGovernance = new ethers.utils.Interface(ABI);

    const calldatas = [
      ICrowGovernance.encodeFunctionData("reward", [jess.address, utils.parseUnits("100000", "ether")]),
    ];

    const propose = await governorWithTwoTokens.propose(targets, [0], calldatas, "Reward a user");

    const tx = await propose.wait();

    if (!tx.events) return;

    const event = tx.events[0];

    await mineNBlocks(5);

    await governorWithTwoTokens.castVote(event?.args?.proposalId, 1);

    await mineNBlocks(17);

    await expect(governorWithTwoTokens.execute(targets, [0], calldatas, utils.id("Reward a user"))).to.be.revertedWith(
      "Governor: proposal not successful"
    );
  });

  it("Should able to reward using governance $CROW", async function () {
    await tokenOne.delegate(bob.address);

    const targets = [tokenOne.address];

    const ABI = ["function reward(address to, uint256 quantity)"];

    const ICrowGovernance = new ethers.utils.Interface(ABI);

    const calldatas = [
      ICrowGovernance.encodeFunctionData("reward", [jess.address, utils.parseUnits("100000", "ether")]),
    ];

    const propose = await governorWithTwoTokens.propose(targets, [0], calldatas, "Reward a user");

    const tx = await propose.wait();

    if (!tx.events) return;

    const event = tx.events[0];

    await mineNBlocks(5);

    await governorWithTwoTokens.castVote(event?.args?.proposalId, 1);

    await mineNBlocks(17);

    await governorWithTwoTokens.execute(targets, [0], calldatas, utils.id("Reward a user"));

    const jessBalance = await tokenOne.balanceOf(jess.address);

    console.log({ bob: bob.address });

    console.log(await tokenOne.getVotes(bob.address));

    expect(jessBalance).to.equal(utils.parseUnits("100000", "ether"));
  });

  it("Should able to reward using governance $vesCrow", async function () {
    await tokenTwo.delegate(bob.address);

    const targets = [tokenOne.address];

    const ABI = ["function reward(address to, uint256 quantity)"];

    const ICrowGovernance = new ethers.utils.Interface(ABI);

    const calldatas = [
      ICrowGovernance.encodeFunctionData("reward", [jess.address, utils.parseUnits("100000", "ether")]),
    ];

    const propose = await governorWithTwoTokens.propose(targets, [0], calldatas, "Reward a user");

    const tx = await propose.wait();

    if (!tx.events) return;

    const event = tx.events[0];

    await mineNBlocks(5);

    await governorWithTwoTokens.castVote(event?.args?.proposalId, 1);

    await mineNBlocks(17);

    await governorWithTwoTokens.execute(targets, [0], calldatas, utils.id("Reward a user"));

    const jessBalance = await tokenOne.balanceOf(jess.address);

    console.log({ bob: bob.address });

    console.log(await tokenOne.getVotes(bob.address));

    expect(jessBalance).to.equal(utils.parseUnits("100000", "ether"));
  });
});
