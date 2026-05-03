// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArcAgentIdentity
 * @notice AI Agent Identity Registry on Arc Network
 * @dev Users connect wallet and mint their own AI Agent NFT
 */
contract ArcAgentIdentity is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    event AgentRegistered(
        uint256 indexed tokenId,
        address indexed owner,
        string agentURI
    );

    constructor() ERC721("Arc AI Agent", "AGENT") Ownable(msg.sender) {}

    /**
     * @notice Mint AI Agent NFT (backend mints to user address - gasless)
     * @param to User wallet address
     * @param agentURI IPFS URI with agent metadata
     */
    function safeMint(address to, string memory agentURI) 
        public 
        onlyOwner 
        returns (uint256) 
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, agentURI);
        
        emit AgentRegistered(tokenId, to, agentURI);
        return tokenId;
    }

    /**
     * @notice Get total agents registered
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }
}
