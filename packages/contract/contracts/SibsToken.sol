// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SibsToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    address GOVERNANCE_ADDRESS;

    constructor() 
        ERC20("SibsToken", "SIBS") 
        ERC20Permit("SibsToken") 
    {
        _mint(msg.sender, 1_000_000e18);
    }

    modifier onlyGovernance() {
        require(msg.sender == GOVERNANCE_ADDRESS, "Governor: only Governor");
        _;
    }

    function setGovernance(address governanceAddress_) public onlyOwner() {
        GOVERNANCE_ADDRESS = governanceAddress_;
    }
    
    function batchReward(address[] memory to, uint256 quantity) public onlyGovernance {
        for(uint i = 0; i < to.length; i++) {
            _mint(to[i], quantity);
        }
    }

    function reward(address to, uint256 quantity) public onlyGovernance {
        _mint(to, quantity);
    }

    // The functions below are overrides required by Solidity.
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}