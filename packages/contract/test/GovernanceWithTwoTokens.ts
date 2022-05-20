import { expect } from "chai";
import { ethers, network, waffle } from "hardhat";

import { GovernorWithTwoTokens } from "../types/GovernorWithTwoTokens";
import { GovernorWithTwoTokens__factory } from "../types/factories/GovernorWithTwoTokens__factory";

import { ERC20Vault } from "../types/ERC20Vault";
import { ERC20Vault__factory } from "../types/factories/ERC20Vault__factory";

import { ERC4626Votes } from "../types/ERC4626Votes";
import { ERC4626Votes__factory } from "../types/factories/ERC4626Votes__factory";

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
  let erc4626VotesOne: ERC4626Votes;
  let erc4626VotesTwo: ERC4626Votes;
  let erc20Vault: ERC20Vault;

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

    const ERC4626Votes = (await ethers.getContractFactory("ERC4626Votes")) as ERC4626Votes__factory;

    const ERC20Vault = (await ethers.getContractFactory("ERC20Vault")) as ERC20Vault__factory;

    erc20Vault = await ERC20Vault.deploy([tokenOne.address, tokenTwo.address]);

    await erc20Vault.deployed();

    erc4626VotesOne = await ERC4626Votes.deploy(tokenOne.address);
    await erc4626VotesOne.deployed();

    erc4626VotesTwo = await ERC4626Votes.deploy(tokenTwo.address);
    await erc4626VotesTwo.deployed();

    const GovernorWithTwoTokens = (await ethers.getContractFactory(
      "GovernorWithTwoTokens"
    )) as GovernorWithTwoTokens__factory;

    governorWithTwoTokens = await GovernorWithTwoTokens.deploy("GovernorWithTwoERC20", erc20Vault.address, 4, 16, 10);
    await governorWithTwoTokens.deployed();

    await tokenOne.setGovernance(governorWithTwoTokens.address);
    await tokenTwo.setGovernance(governorWithTwoTokens.address);
  });

  async function addVaultToGovernanceWithTokenOne() {
    const targets = [governorWithTwoTokens.address];

    const ABI = ["function addVaultForVoting(address vault)"];

    const ICrowGovernance = new ethers.utils.Interface(ABI);

    const calldatas = [ICrowGovernance.encodeFunctionData("addVaultForVoting", [erc4626VotesOne.address])];

    await tokenOne.delegate(bob.address);

    const propose = await governorWithTwoTokens.propose(targets, [0], calldatas, "Add Vault to governance");
    const tx = await propose.wait();

    if (!tx.events) return;

    const event = tx.events[0];

    await mineNBlocks(5);

    await governorWithTwoTokens.castVote(event?.args?.proposalId, 1);

    await mineNBlocks(17);

    await governorWithTwoTokens.execute(targets, [0], calldatas, utils.id("Add Vault to governance"));
  }

  async function addVaultToGovernanceWithTokenTwo() {
    const targets = [governorWithTwoTokens.address];

    const ABI = ["function addVaultForVoting(address vault)"];

    const ICrowGovernance = new ethers.utils.Interface(ABI);

    const calldatas = [ICrowGovernance.encodeFunctionData("addVaultForVoting", [erc4626VotesTwo.address])];

    await tokenTwo.delegate(bob.address);

    const propose = await governorWithTwoTokens.propose(targets, [0], calldatas, "Add Vault to governance");
    const tx = await propose.wait();

    if (!tx.events) return;

    const event = tx.events[0];

    await mineNBlocks(5);

    await governorWithTwoTokens.castVote(event?.args?.proposalId, 1);

    await mineNBlocks(17);

    await governorWithTwoTokens.execute(targets, [0], calldatas, utils.id("Add Vault to governance"));
  }

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

  it("Should able to reward using governance $CROW on a Vault", async function () {
    await addVaultToGovernanceWithTokenOne();

    const totalBalance = await tokenOne.balanceOf(bob.address);
    await tokenOne.approve(erc4626VotesOne.address, totalBalance);

    await erc4626VotesOne.deposit(totalBalance, bob.address);
    await erc4626VotesOne.delegate(bob.address);

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

  it("Should able to reward using governance $vesCrow on a Vault", async function () {
    await addVaultToGovernanceWithTokenTwo();

    const totalBalance = await tokenTwo.balanceOf(bob.address);
    await tokenTwo.approve(erc4626VotesTwo.address, totalBalance);

    await erc4626VotesTwo.deposit(totalBalance, bob.address);
    await erc4626VotesTwo.delegate(bob.address);

    const targets = [tokenTwo.address];

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

    const jessBalance = await tokenTwo.balanceOf(jess.address);

    console.log({ bob: bob.address });

    console.log(await tokenTwo.getVotes(bob.address));

    expect(jessBalance).to.equal(utils.parseUnits("100000", "ether"));
  });
});
