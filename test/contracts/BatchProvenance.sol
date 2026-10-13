// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BatchProvenance
 * @dev Minimal contract for anchoring batch evidence hashes on-chain.
 * Only authorized writers (MavunoWise backend) can record anchors.
 */
contract BatchProvenance {
    address public authorizedWriter;
    
    // Mapping from batch reference ID to evidence hash
    mapping(string => bytes32) public anchors;
    
    // Event emitted when an anchor is successfully recorded
    event AnchorRecorded(string batchRef, bytes32 evidenceHash, uint256 timestamp);

    constructor() {
        authorizedWriter = msg.sender;
    }

    modifier onlyAuthorizedWriter() {
        require(msg.sender == authorizedWriter, "Unauthorized: Only authorized writer can record anchors");
        _;
    }

    /**
     * @dev Records the evidence hash for a given batch reference.
     * Reverts if an anchor is already set for this batchRef (immutable history).
     */
    function recordAnchor(string memory batchRef, bytes32 evidenceHash) external onlyAuthorizedWriter {
        require(anchors[batchRef] == bytes32(0), "Anchor already exists for this batch");
        require(evidenceHash != bytes32(0), "Invalid evidence hash");
        
        anchors[batchRef] = evidenceHash;
        emit AnchorRecorded(batchRef, evidenceHash, block.timestamp);
    }

    /**
     * @dev Reads the anchored hash for a given batch reference.
     */
    function getAnchor(string memory batchRef) external view returns (bytes32) {
        return anchors[batchRef];
    }
}
