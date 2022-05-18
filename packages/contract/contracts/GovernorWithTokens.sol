// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/compatibility/GovernorCompatibilityBravo.sol";
import "./GovernorVotes.sol";
import "./GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorProposalThreshold.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "hardhat/console.sol";

contract GovernorWithTwoTokens is GovernorCountingSimple, GovernorSettings, GovernorProposalThreshold, GovernorVotesQuorumFraction {
    constructor(
        string memory name_,
        IVotes[] memory tokens_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 quorumNumerator_
    )
        Governor(name_)
        GovernorSettings(votingDelay_, votingPeriod_, 0)
        GovernorVotes(tokens_)
        GovernorVotesQuorumFraction(quorumNumerator_)
    {}

   function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        virtual
        override(Governor, GovernorProposalThreshold)
        returns (uint256)
    {
        return super.propose(targets, values, calldatas, description);
    }
}