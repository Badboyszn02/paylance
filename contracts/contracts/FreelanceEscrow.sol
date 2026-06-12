// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// Dispute authority follows factory.owner(); new funding blocked when factory is paused.
interface IEscrowFactory {
    function owner() external view returns (address);
    function paused() external view returns (bool);
}

// One escrow per order, deployed as a BeaconProxy by EscrowFactory.
contract FreelanceEscrow is Initializable {
    using SafeERC20 for IERC20;

    enum Status { Created, Funded, Released, Refunded, Resolved }

    uint8 public constant platformFeePercent = 2;

    // reentrancy guard
    bool private _locked;
    modifier nonReentrant() {
        require(!_locked, "reentrant");
        _locked = true;
        _;
        _locked = false;
    }

    // init-once config
    address public factory;
    uint256 public orderId;
    address public clientAddress;
    address public freelancerAddress;
    address public platformWallet;
    IERC20  public usdc;
    uint256 public amount; // agreed at create time, enforced in lockFunds

    // mutable state
    uint256 public createdAt;
    bool    public clientSatisfied;
    bool    public freelancerSatisfied;
    bool    public clientCancelled;
    bool    public freelancerCancelled;
    Status  public status;

    uint256[40] private __gap;

    event FundsLocked(uint256 indexed orderId, uint256 amount, uint256 timestamp);
    event FundsReleased(uint256 indexed orderId, uint256 freelancerAmount, uint256 feeAmount, uint256 timestamp);
    event FundsRefunded(uint256 indexed orderId, uint256 amount, uint256 timestamp);
    event DisputeResolved(uint256 indexed orderId, uint256 freelancerAmount, uint256 clientAmount, uint256 timestamp);
    event SatisfiedMarked(uint256 indexed orderId, address indexed userAddress, uint256 timestamp);
    event CancelledMarked(uint256 indexed orderId, address indexed userAddress, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == IEscrowFactory(factory).owner(), "not platform admin");
        _;
    }

    modifier onlyParty() {
        require(msg.sender == clientAddress || msg.sender == freelancerAddress, "not a party");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _factory,
        uint256 _orderId,
        address _client,
        address _freelancer,
        uint256 _amount,
        address _platformWallet,
        address _usdc
    ) external initializer {
        require(_factory != address(0), "zero factory");
        require(_client != address(0) && _freelancer != address(0), "zero party");
        require(_platformWallet != address(0) && _usdc != address(0), "zero config");
        require(_amount > 0, "zero amount");
        factory = _factory;
        orderId = _orderId;
        clientAddress = _client;
        freelancerAddress = _freelancer;
        amount = _amount;
        platformWallet = _platformWallet;
        usdc = IERC20(_usdc);
        status = Status.Created;
    }

    /// @notice Client funds the escrow. Client must approve USDC first.
    function lockFunds(uint256 _orderId, uint256 _amount) external nonReentrant {
        require(msg.sender == clientAddress, "only client funds");
        require(!IEscrowFactory(factory).paused(), "platform paused");
        require(_orderId == orderId, "wrong order");
        require(_amount == amount, "wrong amount");
        require(status == Status.Created, "already funded");

        createdAt = block.timestamp;
        status = Status.Funded;

        usdc.safeTransferFrom(clientAddress, address(this), amount);
        emit FundsLocked(orderId, amount, block.timestamp);
    }

    /// @notice Caller marks their own side satisfied. Auto-releases when both true.
    function markSatisfied() external nonReentrant onlyParty {
        require(status == Status.Funded, "not funded");
        if (msg.sender == clientAddress) clientSatisfied = true;
        else freelancerSatisfied = true;
        emit SatisfiedMarked(orderId, msg.sender, block.timestamp);
        if (clientSatisfied && freelancerSatisfied) _release();
    }

    /// @notice Caller marks their own side cancelled. Auto-refunds when both cancel.
    function markCancelled() external nonReentrant onlyParty {
        require(status == Status.Funded, "not funded");
        if (msg.sender == clientAddress) clientCancelled = true;
        else freelancerCancelled = true;
        emit CancelledMarked(orderId, msg.sender, block.timestamp);
        if (clientCancelled && freelancerCancelled) _refund();
    }

    function releaseFunds() external nonReentrant {
        require(clientSatisfied && freelancerSatisfied, "both must be satisfied");
        _release();
    }

    function refundFunds() external nonReentrant {
        require(clientCancelled && freelancerCancelled, "both must cancel");
        _refund();
    }

    /// @notice Admin dispute split: freelancerAmount + clientAmount must equal amount - fee.
    function resolveDispute(uint256 freelancerAmount, uint256 clientAmount)
        external
        nonReentrant
        onlyAdmin
    {
        require(status == Status.Funded, "not funded");
        uint256 fee = (amount * platformFeePercent) / 100;
        require(freelancerAmount + clientAmount == amount - fee, "split != amount - fee");

        status = Status.Resolved;
        if (fee > 0) usdc.safeTransfer(platformWallet, fee);
        if (freelancerAmount > 0) usdc.safeTransfer(freelancerAddress, freelancerAmount);
        if (clientAmount > 0) usdc.safeTransfer(clientAddress, clientAmount);
        emit DisputeResolved(orderId, freelancerAmount, clientAmount, block.timestamp);
    }

    function getOrderDetails()
        external
        view
        returns (
            uint256 _orderId,
            address _client,
            address _freelancer,
            address _platformWallet,
            uint256 _amount,
            uint8   _platformFeePercent,
            bool    _clientSatisfied,
            bool    _freelancerSatisfied,
            bool    _clientCancelled,
            bool    _freelancerCancelled,
            Status  _status,
            uint256 _createdAt
        )
    {
        return (
            orderId, clientAddress, freelancerAddress, platformWallet, amount, platformFeePercent,
            clientSatisfied, freelancerSatisfied, clientCancelled, freelancerCancelled, status, createdAt
        );
    }

    function _release() private {
        require(status == Status.Funded, "not funded");
        status = Status.Released;
        uint256 fee = (amount * platformFeePercent) / 100;
        uint256 freelancerAmount = amount - fee;
        if (fee > 0) usdc.safeTransfer(platformWallet, fee);
        usdc.safeTransfer(freelancerAddress, freelancerAmount);
        emit FundsReleased(orderId, freelancerAmount, fee, block.timestamp);
    }

    function _refund() private {
        require(status == Status.Funded, "not funded");
        status = Status.Refunded;
        usdc.safeTransfer(clientAddress, amount);
        emit FundsRefunded(orderId, amount, block.timestamp);
    }
}
