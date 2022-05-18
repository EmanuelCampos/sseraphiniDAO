// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (governance/extensions/GovernorVotes.sol)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";
import "hardhat/console.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from an {ERC20Votes} token, or since v4.5 an {ERC721Votes} token.
 *
 * _Available since v4.3._
 */
abstract contract GovernorVotes is Governor {
    IVotes[] public tokens;

    constructor(IVotes[] memory tokensAddresses) {
        tokens = tokensAddresses;
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {Governor-_getVotes}).
     */
    function _getVotes(
        address account,
        uint256 blockNumber,
        bytes memory /*params*/
    ) internal view virtual override returns (uint256) {
        uint256 votingWeight = 0;

        console.log('tokens.length');
        console.log(tokens.length);

        for(uint256 i = 0; i < tokens.length; i++) {
            IVotes token = tokens[i];            
            uint256 tokenVotes = token.getPastVotes(account, blockNumber);

            console.log('tokenVotes');
            console.log(tokenVotes);

            votingWeight += tokenVotes;
        }

        console.log('votingWeight');
        console.log(votingWeight);
        
        return votingWeight;
    }
}
