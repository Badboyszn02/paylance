// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title PayLance ListingRegistry
/// @notice Event-only record of listings on Arc. Each listing hash registers once.
contract ListingRegistry {
    event ListingPosted(
        address indexed poster,
        bytes32 indexed listingHash,
        uint256 timestamp
    );

    mapping(bytes32 => bool) public posted;

    error AlreadyPosted();

    function registerListing(bytes32 listingHash) external {
        if (posted[listingHash]) revert AlreadyPosted();
        posted[listingHash] = true;
        emit ListingPosted(msg.sender, listingHash, block.timestamp);
    }
}
