// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";

/**
 * @dev Extension of ERC4626 which allows for voting based on an account's underlying asset balance
 */
contract ERC4626Vault {

    IVotes[] private _assets;

    constructor(IVotes[] memory assets)
    {
         _assets = assets;
    }

    /**
     * @dev Get the totalSupply of tokens.
     */
    function totalSupply(uint256 blockNumber) public virtual returns(uint256) {
        uint256 supply;

        for(uint256 i = 0; i < _assets.length; i++)
        {
            supply = supply += _assets[i].getPastTotalSupply(blockNumber);
        }

        return supply;
    }

    /**
     * @dev Get the past votes of tokens
     */
    function getPastVotes(address account, uint256 blockNumber) public virtual returns(uint256) {
        uint256 votes;

        for(uint256 i = 0; i < _assets.length; i++)
        {
            votes = votes += _assets[i].getPastVotes(account, blockNumber);
        }

        return votes;
    }
}
