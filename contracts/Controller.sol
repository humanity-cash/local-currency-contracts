// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interface/IWallet.sol";
import "./interface/IWalletFactory.sol";
import "./interface/IVersionedContract.sol";
import "./lib/ABDKMath64x64.sol";

/**
 * @title Controller contract
 *
 * @dev Administrative and orchestrator contract for local currencies
 *
 * @author Aaron Boyd <https://github.com/aaronmboyd>
 * @author Sebastian Gerske <https://github.com/h34d>
 */
contract Controller is
    IVersionedContract,
    AccessControlEnumerable,
    Ownable,
    Pausable,
    ReentrancyGuard
{
    using SafeERC20 for ERC20PresetMinterPauser;
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    using Address for address;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant COMMUNITY_CHEST = keccak256("COMMUNITY_CHEST");
    bytes32 public constant HUMANITY_CASH = keccak256("HUMANITY_CASH");
    address public communityChestAddress;
    address public humanityCashAddress;
    int256 redemptionFeeNumerator;
    int256 redemptionFeeDenominator;

    /**
     * @notice Triggered when a new user has been created
     *
     * @param _userId           Hashed bytes32 of the userId
     * @param _walletAddress    Address of the wallet
     */
    event NewUser(bytes32 indexed _userId, address indexed _walletAddress);

    /**
     * @notice Triggered when a user has deposited
     *
     * @param _userId           Hashed bytes32 of the userId
     * @param _operator         Address of the bank operator that fulfilled the deposit
     * @param _value            Value of the deposit
     */
    event UserDeposit(bytes32 indexed _userId, address indexed _operator, uint256 _value);

    /**
     * @notice Triggered when a user has withdrawn
     *
     * @param _userId           Hashed bytes32 of the userId
     * @param _operator         Address of the bank operator that will fulfill the withdrawal
     * @param _value            Value of the withdrawal
     */
    event UserWithdrawal(bytes32 indexed _userId, address indexed _operator, uint256 _value);

    /**
     * @notice Triggered when an amount has been transferred from one wallet to another
     *
     * @param _fromUserId       Hashed bytes32 of the sender
     * @param _toUserId         Hashed bytes32 of the receiver
     * @param _amt              Amount of the transaction
     */
    event TransferToEvent(bytes32 indexed _fromUserId, bytes32 indexed _toUserId, uint256 _amt);

    /**
     * @notice Triggered when an amount has been transferred from one wallet to another
     *
     * @param _fromUserId       Hashed bytes32 of the sender
     * @param _toAddress        Address of the receiver
     * @param _amt              Amount of the transaction
     */
    event TransferToEvent(bytes32 indexed _fromUserId, address indexed _toAddress, uint256 _amt);

    /**
     * @notice Triggered when the Wallet Factory is updated
     *
     * @param _oldFactoryAddress   Old factory address
     * @param _newFactoryAddress   New factory address
     */
    event FactoryUpdated(address indexed _oldFactoryAddress, address indexed _newFactoryAddress);

    /**
     * @notice Triggered when the Community Chest address is updated
     *
     * @param _oldCommunityChestAddress   Old address
     * @param _newCommunityChestAddress   New address
     */
    event CommunityChestUpdated(
        address indexed _oldCommunityChestAddress,
        address indexed _newCommunityChestAddress
    );

    /**
     * @notice Triggered when the Humanity Cash address is updated
     *
     * @param _oldHumanityCashAddress   Old address
     * @param _newHumanityCashAddress   New address
     */
    event HumanityCashUpdated(
        address indexed _oldHumanityCashAddress,
        address indexed _newHumanityCashAddress
    );

    /**
     * @notice Triggered when the Redemption Fee is updated
     *
     * @param _oldNumerator   Old numerator
     * @param _oldDenominator Old denominator
     * @param _newNumerator   New numerator
     * @param _newDenominator New denominator
     */
    event RedemptionFeeUpdated(
        int256 _oldNumerator,
        int256 _oldDenominator,
        int256 _newNumerator,
        int256 _newDenominator
    );

    /**
     * @notice Triggered when a redemption (withdrawal) fee is collected
     *
     * @param _redemptionFeeAddress   Recipient of the fee (the humanityCashAddress)
     * @param _redemptionFee          New factory address
     */
    event RedemptionFee(address indexed _redemptionFeeAddress, uint256 _redemptionFee);

    ERC20PresetMinterPauser public erc20Token;
    IWalletFactory public walletFactory;

    // Mapping of Wallet identifiers to their contract address
    EnumerableMap.UintToAddressMap private wallets;

    /**
     * @notice Used to initialize a new Controller contract
     *
     * @param _erc20Token token used
     */
    constructor(address _erc20Token, address _walletFactory) Ownable() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(ADMIN_ROLE, _msgSender());
        _setupRole(OPERATOR_ROLE, _msgSender());

        erc20Token = ERC20PresetMinterPauser(_erc20Token);
        walletFactory = IWalletFactory(_walletFactory);

        _newWallet(COMMUNITY_CHEST);
        communityChestAddress = getWalletAddress(COMMUNITY_CHEST);

        _newWallet(HUMANITY_CASH);
        humanityCashAddress = getWalletAddress(HUMANITY_CASH);

        redemptionFeeNumerator = 15;
        redemptionFeeDenominator = 1000;
    }

    /**********************************************************************
     *
     * View Methods
     *
     **********************************************************************/

    /**
     * @notice Returns the storage, major, minor, and patch version of the contract.
     * @return The storage, major, minor, and patch version of the contract.
     */
    function getVersionNumber()
        external
        pure
        override
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (1, 2, 0, 1);
    }

    /**
     * @notice Enforces values > 0 only
     */
    modifier greaterThanZero(uint256 _value) {
        require(_value > 0, "ERR_ZERO_VALUE");
        _;
    }

    /**
     * @notice Enforces value to not be greater than a user's available balance
     */
    modifier balanceAvailable(bytes32 _userId, uint256 _value) {
        require(balanceOfWallet(_userId) >= _value, "ERR_NO_BALANCE");
        _;
    }

    /**
     * @notice Enforces a _userId should not be mapped to an existing user / contract address
     */
    modifier userNotExist(bytes32 _userId) {
        require(!wallets.contains(uint256(_userId)), "ERR_USER_EXISTS");
        _;
    }

    /**
     * @notice Enforces a _userId exists
     */
    modifier userExist(bytes32 _userId) {
        require(wallets.contains(uint256(_userId)), "ERR_USER_NOT_EXISTS");
        _;
    }

    /**
     * @notice Retrieves the available balance of a wallet
     *
     * @param _userId user identifier
     * @return uint256 available balance
     */
    function balanceOfWallet(bytes32 _userId) public view returns (uint256) {
        address walletAddress = wallets.get(uint256(_userId));
        return balanceOfWallet(walletAddress);
    }

    /**
     * @notice Retrieves the available balance of a wallet
     *
     * @param _walletAddress wallet address
     * @return uint256 available balance
     */
    function balanceOfWallet(address _walletAddress) public view returns (uint256) {
        IWallet wallet = IWallet(_walletAddress);
        return wallet.availableBalance();
    }

    /**
     * @notice retrieve contract address for a Wallet
     *
     * @param _userId user identifier
     * @return address of user's contract
     */
    function getWalletAddress(bytes32 _userId) public view userExist(_userId) returns (address) {
        return wallets.get(uint256(_userId));
    }

    /**
     * @notice Get wallet address at index
     * @dev Used for iterating the complete list of wallets
     *
     */
    function getWalletAddressAtIndex(uint256 _index) external view returns (address) {
        // .at function returns a tuple of (uint256, address)
        address walletAddress;
        (, walletAddress) = wallets.at(_index);

        return walletAddress;
    }

    /**
     * @notice Get count of wallets
     *
     */
    function getWalletCount() external view returns (uint256) {
        return wallets.length();
    }

    /**********************************************************************
     *
     * Operator Methods
     *
     **********************************************************************/

    /**
     * @notice Transfers a local currency token between two existing wallets
     *
     * @param _fromUserId   User identifier
     * @param _toUserId     Receiver identifier
     * @param _value        Amount to transfer
     * @param _roundUpValue Round up value to transfer (can be zero)
     */
    function transfer(
        bytes32 _fromUserId,
        bytes32 _toUserId,
        uint256 _value,
        uint256 _roundUpValue
    )
        external
        greaterThanZero(_value)
        userExist(_fromUserId)
        balanceAvailable(_fromUserId, (_value + _roundUpValue))
        userExist(_toUserId)
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
        returns (bool)
    {
        bool success = _transfer(
            getWalletAddress(_fromUserId),
            getWalletAddress(_toUserId),
            _value
        );
        if (success) emit TransferToEvent(_fromUserId, _toUserId, _value);

        if (_roundUpValue > 0) {
            success = success && _roundUp(_fromUserId, _roundUpValue);
        }
        return success;
    }

    /**
     * @notice Transfers a local currency token between two existing wallets
     *
     * @param _fromUserId   User identifier
     * @param _toAddress    Receiver identifier
     * @param _value        Amount to transfer
     * @param _roundUpValue Round up value to transfer (can be zero)
     */
    function transfer(
        bytes32 _fromUserId,
        address _toAddress,
        uint256 _value,
        uint256 _roundUpValue
    )
        external
        greaterThanZero(_value)
        userExist(_fromUserId)
        balanceAvailable(_fromUserId, (_value + _roundUpValue))
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
        returns (bool)
    {
        bool success = _transfer(getWalletAddress(_fromUserId), _toAddress, _value);
        if (success) emit TransferToEvent(_fromUserId, _toAddress, _value);

        if (_roundUpValue > 0) {
            success = success && _roundUp(_fromUserId, _roundUpValue);
        }
        return success;
    }

    /**
     * @notice Internal implementation of transferring a local currency token between two existing wallets
     * @dev Implementation of external "transferTo" function so that it may be called internally without reentrancy guard incrementing
     *
     * @param _fromWallet   Sender wallet
     * @param _toWallet     Receiver wallet
     * @param _value        Amount to transfer
     */
    function _transfer(
        address _fromWallet,
        address _toWallet,
        uint256 _value
    ) private returns (bool) {
        return IWallet(_fromWallet).transferTo(IWallet(_toWallet), _value);
    }

    /**
     * @notice Transfers a local currency token to the Community Chest
     *
     * @param _fromUserId   User identifier
     * @param _roundUpValue Round up value to transfer (can be zero)
     */
    function _roundUp(bytes32 _fromUserId, uint256 _roundUpValue) internal returns (bool) {
        bool success = _transfer(
            getWalletAddress(_fromUserId),
            communityChestAddress,
            _roundUpValue
        );
        if (success) emit TransferToEvent(_fromUserId, COMMUNITY_CHEST, _roundUpValue);
        return success;
    }

    /**
     * @notice Deposits tokens in the wallet identified by the given user id
     *
     * @param _userId   User identifier
     * @param _value    Amount to deposit
     */
    function deposit(bytes32 _userId, uint256 _value)
        external
        greaterThanZero(_value)
        userExist(_userId)
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
        returns (bool)
    {
        return _deposit(_userId, _value);
    }

    /**
     * @notice Internal implementation of deposits tokens in the wallet identified by the given user id
     *
     * @param _userId   User identifier
     * @param _value    Amount to deposit
     */
    function _deposit(bytes32 _userId, uint256 _value) private returns (bool) {
        address walletAddress = getWalletAddress(_userId);
        erc20Token.mint(walletAddress, _value);
        emit UserDeposit(_userId, msg.sender, _value);
        return true;
    }

    /**
     * @notice Withdraws tokens from the wallet identified by the given user id
     *
     * @param _userId   User identifier
     * @param _value    Amount to withdraw
     */
    function withdraw(bytes32 _userId, uint256 _value)
        external
        greaterThanZero(_value)
        userExist(_userId)
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
        returns (bool)
    {
        return _withdraw(_userId, _value);
    }

    /**
     * @notice Internal implementation of withdraw tokens in the wallet identified by the given user id
     *
     * @param _userId   User identifier
     * @param _value    Amount to withdraw
     */
    function _withdraw(bytes32 _userId, uint256 _value) private returns (bool) {
        address walletAddress = getWalletAddress(_userId);

        // Withdraw full amount to Controller
        IWallet(walletAddress).withdraw(_value);

        // Calculate redemption fee
        int128 redemptionFeeRatio = ABDKMath64x64.divi(
            redemptionFeeNumerator,
            redemptionFeeDenominator
        );
        uint256 redemptionFeeAmount = ABDKMath64x64.mulu(redemptionFeeRatio, _value);

        // Send redemption fee to humanityCashAddress
        // If it's more than 0.01 in the (dollar pegged) local currency token

        uint256 burnAmount = _value;
        uint256 withdrawalAmount = _value;

        if (redemptionFeeAmount >= (0.01 ether)) {
            erc20Token.transfer(humanityCashAddress, redemptionFeeAmount);
            burnAmount = burnAmount - redemptionFeeAmount;
            withdrawalAmount = withdrawalAmount - redemptionFeeAmount;
            emit RedemptionFee(humanityCashAddress, redemptionFeeAmount);
        }

        // Burn
        erc20Token.burn(burnAmount);

        emit UserWithdrawal(_userId, msg.sender, withdrawalAmount);
        return true;
    }

    /**
     * @notice create a new user and assign them a wallet contract
     *
     * @param _userId user identifier
     */
    function newWallet(bytes32 _userId)
        external
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
        userNotExist(_userId)
    {
        _newWallet(_userId);
    }

    /**
     * @notice create a new user and assign them a wallet contract
     *
     * @param _userId user identifier
     */
    function _newWallet(bytes32 _userId) internal {
        address newWalletAddress = walletFactory.createProxiedWallet(_userId);
        require(newWalletAddress != address(0x0), "ERR_WALLET_FAILED");

        wallets.set(uint256(_userId), newWalletAddress);

        emit NewUser(_userId, newWalletAddress);
    }

    /**********************************************************************
     *
     * Owner Methods
     *
     **********************************************************************/

    /**
     * @notice Public update to a new Wallet Factory
     *
     * @param _newFactoryAddress   new factory address
     */
    function setWalletFactory(address _newFactoryAddress) external onlyOwner {
        _setWalletFactory(_newFactoryAddress);
    }

    /**
     * @notice Internal implementation of update to a new Wallet Factory
     *
     * @param _newFactoryAddress   new factory address
     */
    function _setWalletFactory(address _newFactoryAddress) private {
        address oldAddress = address(walletFactory);
        walletFactory = IWalletFactory(_newFactoryAddress);
        emit FactoryUpdated(oldAddress, _newFactoryAddress);
    }

    /**
     * @notice Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     *
     *
     * @param newOwner new owner of this contract
     *
     */
    function transferContractOwnership(address newOwner) public onlyOwner {
        super.transferOwnership(newOwner);
    }

    /**
     * @notice Transfers ownership of the wallet to a new account (`newOwner`).
     * Can only be called by the current owner.
     *
     *
     * @param newOwner new owner of wallet
     * @param userId current owner of the wallet
     *
     */
    function transferWalletOwnership(address newOwner, bytes32 userId) public onlyOwner {
        address walletAddress = getWalletAddress(userId);
        IWallet user = IWallet(walletAddress);
        user.transferController(newOwner);
    }

    /**
     * @notice Update implementation address for wallets
     *
     * @param _newLogic New implementation logic for wallet proxies
     *
     */
    function updateWalletImplementation(address _newLogic) external onlyOwner {
        uint256 i;
        for (i = 0; i < wallets.length(); i++) {
            address walletAddress;
            // .at function returns a tuple of (uint256, address)
            (, walletAddress) = wallets.at(i);
            walletFactory.updateProxyImplementation(walletAddress, _newLogic);
        }
    }

    /**
     * @notice Triggers stopped state.
     *
     * @dev Requirements: The contract must not be paused.
     */
    function pause() external onlyOwner nonReentrant {
        _pause();
    }

    /**
     * @notice Returns to normal state.
     *
     * @dev Requirements: The contract must be paused.
     */
    function unpause() external onlyOwner nonReentrant {
        _unpause();
    }

    /**
     * @notice Emergency withdrawal of all remaining token to the owner account
     *
     * @dev The contract must be paused
     * @dev Sends erc20 to current owner
     */
    function withdrawToOwner() external onlyOwner whenPaused nonReentrant {
        uint256 balanceOf = erc20Token.balanceOf(address(this));
        erc20Token.transfer(owner(), balanceOf);
    }

    /**
     * @notice Update community chest address
     *
     * @param _communityChest new address
     */
    function setCommunityChest(address _communityChest) external onlyOwner {
        address oldAddress = communityChestAddress;
        communityChestAddress = _communityChest;
        emit CommunityChestUpdated(oldAddress, _communityChest);
    }

    /**
     * @notice Update Humanity Cash Address
     *
     * @param _humanityCashAddress new address
     */
    function setHumanityCashAddress(address _humanityCashAddress) external onlyOwner {
        address oldAddress = humanityCashAddress;
        humanityCashAddress = _humanityCashAddress;
        emit HumanityCashUpdated(oldAddress, _humanityCashAddress);
    }

    /**
     * @notice Set redemption fee
     *
     * @param _numerator   Redemption fee numerator
     * @param _denominator Redemption fee denominator
     */
    function setRedemptionFee(int256 _numerator, int256 _denominator) external onlyOwner {
        int256 oldNumerator = redemptionFeeNumerator;
        int256 oldDenominator = redemptionFeeDenominator;
        redemptionFeeNumerator = _numerator;
        redemptionFeeDenominator = _denominator;
        emit RedemptionFeeUpdated(
            oldNumerator,
            oldDenominator,
            redemptionFeeNumerator,
            redemptionFeeDenominator
        );
    }
}
