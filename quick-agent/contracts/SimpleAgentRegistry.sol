// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleAgentRegistry
 * @notice Minimal agent registry for AI agents on Arc Network
 * @dev Keep it simple for beginners to understand
 */
contract SimpleAgentRegistry {
    // Agent data structure
    struct Agent {
        string name;
        string description;
        string avatarURI;        // IPFS URI
        address owner;
        uint256 createdAt;
        bool active;
    }

    // Storage
    Agent[] public agents;
    mapping(address => uint256[]) public ownerToAgents;

    // Events
    event AgentCreated(
        uint256 indexed agentId,
        address indexed owner,
        string name
    );
    
    event AgentDeactivated(
        uint256 indexed agentId,
        address indexed owner
    );

    /**
     * @notice Create a new agent
     * @param name Agent name
     * @param description Agent description
     * @param avatarURI IPFS URI for avatar
     */
    function createAgent(
        string calldata name,
        string calldata description,
        string calldata avatarURI
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name required");

        uint256 agentId = agents.length;

        agents.push(Agent({
            name: name,
            description: description,
            avatarURI: avatarURI,
            owner: msg.sender,
            createdAt: block.timestamp,
            active: true
        }));

        ownerToAgents[msg.sender].push(agentId);

        emit AgentCreated(agentId, msg.sender, name);
        return agentId;
    }

    /**
     * @notice Get agent by ID
     */
    function getAgent(uint256 agentId)
        external
        view
        returns (Agent memory)
    {
        require(agentId < agents.length, "Invalid ID");
        return agents[agentId];
    }

    /**
     * @notice Get total number of agents
     */
    function getAgentCount() external view returns (uint256) {
        return agents.length;
    }

    /**
     * @notice Get agents by owner
     */
    function getAgentsByOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        return ownerToAgents[owner];
    }

    /**
     * @notice Deactivate an agent (only owner)
     */
    function deactivateAgent(uint256 agentId) external {
        require(agentId < agents.length, "Invalid ID");
        require(agents[agentId].owner == msg.sender, "Not owner");

        agents[agentId].active = false;
        emit AgentDeactivated(agentId, msg.sender);
    }
}
