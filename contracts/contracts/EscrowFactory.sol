// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "./FreelanceEscrow.sol";

// Deploys one FreelanceEscrow (BeaconProxy) per order. UUPS upgradeable factory;
// per-order escrows upgrade together by upgrading the beacon.
contract EscrowFactory is
    Initializable,
    Ownable2StepUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    address public beacon;
    address public usdc;
    address public platformWallet;

    mapping(uint256 => address) public escrows; // orderId => escrow proxy
    uint256[] public orderIds;

    uint256[40] private __gap;

    event EscrowCreated(
        uint256 indexed orderId,
        address indexed escrow,
        address client,
        address freelancer,
        uint256 amount,
        uint256 timestamp
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _beacon,
        address _usdc,
        address _platformWallet,
        address _owner
    ) external initializer {
        require(_beacon != address(0) && _usdc != address(0) && _platformWallet != address(0), "zero config");
        __Ownable_init(_owner);
        __Ownable2Step_init();
        __Pausable_init();
        beacon = _beacon;
        usdc = _usdc;
        platformWallet = _platformWallet;
    }

    function createEscrow(
        uint256 orderId,
        address client,
        address freelancer,
        uint256 amount
    ) external onlyOwner whenNotPaused returns (address escrow) {
        require(escrows[orderId] == address(0), "escrow exists");
        require(amount > 0, "amount must be > 0");

        bytes memory initData = abi.encodeCall(
            FreelanceEscrow.initialize,
            (address(this), orderId, client, freelancer, amount, platformWallet, usdc)
        );
        escrow = address(new BeaconProxy(beacon, initData));

        escrows[orderId] = escrow;
        orderIds.push(orderId);
        emit EscrowCreated(orderId, escrow, client, freelancer, amount, block.timestamp);
    }

    function getEscrowAddress(uint256 orderId) external view returns (address) {
        return escrows[orderId];
    }

    function totalEscrows() external view returns (uint256) {
        return orderIds.length;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
