// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleAgentRegistry
 * @notice A simple registry for AI Agents on Arc Network
 * @dev Frontend-first approach - minimal smart contract logic
 */
contract SimpleAgentRegistry {
    /// @notice Emitted when a new agent is registered
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        string metadataURI,
        uint256 timestamp
    );

    /// @notice Emitted when an agent's metadata is updated
    event AgentUpdated(
        uint256 indexed agentId,
        string newMetadataURI,
        uint256 timestamp
    );

    /// @notice Agent data structure
    struct Agent {
        uint256 id;
        address owner;
        string metadataURI; // IPFS hash with agent details
        uint256 createdAt;
        uint256 updatedAt;
        bool isActive;
    }

    /// @notice Counter for agent IDs
    uint256 private _agentIdCounter;

    /// @notice Mapping from agent ID to Agent struct
    mapping(uint256 => Agent) private _agents;

    /// @notice Mapping from owner to their agent IDs
    mapping(address => uint256[]) private _ownerAgents;

    /**
     * @notice Register a new AI agent
     * @param metadataURI IPFS URI containing agent metadata (name, description, capabilities, etc.)
     * @return agentId The unique ID of the newly created agent
     */
    function registerAgent(string memory metadataURI)
        external
        returns (uint256 agentId)
    {
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");

        agentId = ++_agentIdCounter;

        _agents[agentId] = Agent({
            id: agentId,
            owner: msg.sender,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true
        });

        _ownerAgents[msg.sender].push(agentId);

        emit AgentRegistered(agentId, msg.sender, metadataURI, block.timestamp);
    }

    /**
     * @notice Update an existing agent's metadata
     * @param agentId The ID of the agent to update
     * @param newMetadataURI New IPFS URI with updated metadata
     */
    function updateAgent(uint256 agentId, string memory newMetadataURI)
        external
    {
        require(_agents[agentId].owner == msg.sender, "Not the agent owner");
        require(_agents[agentId].isActive, "Agent is not active");
        require(bytes(newMetadataURI).length > 0, "Metadata URI cannot be empty");

        _agents[agentId].metadataURI = newMetadataURI;
        _agents[agentId].updatedAt = block.timestamp;

        emit AgentUpdated(agentId, newMetadataURI, block.timestamp);
    }

    /**
     * @notice Deactivate an agent (doesn't delete, just marks inactive)
     * @param agentId The ID of the agent to deactivate
     */
    function deactivateAgent(uint256 agentId) external {
        require(_agents[agentId].owner == msg.sender, "Not the agent owner");
        require(_agents[agentId].isActive, "Agent already inactive");

        _agents[agentId].isActive = false;
        _agents[agentId].updatedAt = block.timestamp;
    }

    /**
     * @notice Get agent details by ID
     * @param agentId The ID of the agent
     * @return Agent struct with all details
     */
    function getAgent(uint256 agentId) external view returns (Agent memory) {
        require(_agents[agentId].id != 0, "Agent does not exist");
        return _agents[agentId];
    }

    /**
     * @notice Get all agent IDs owned by an address
     * @param owner The address of the owner
     * @return Array of agent IDs
     */
    function getAgentsByOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        return _ownerAgents[owner];
    }

    /**
     * @notice Get total number of agents created
     * @return Total agent count
     */
    function totalAgents() external view returns (uint256) {
        return _agentIdCounter;
    }

    /**
     * @notice Check if an agent is active
     * @param agentId The ID of the agent
     * @return True if agent is active
     */
    function isAgentActive(uint256 agentId) external view returns (bool) {
        return _agents[agentId].isActive;
    }
}
