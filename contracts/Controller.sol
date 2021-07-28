// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "./interface/IWallet.sol";
import "./interface/IWalletFactory.sol";
import "./interface/IVersionedContract.sol";

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
    using SafeMath for uint256;
    using SafeERC20 for ERC20PresetMinterPauser;
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

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
     * @notice Triggered when the Wallet Factory is updated
     *
     * @param _oldFactoryAddress   Old factory address
     * @param _newFactoryAddress   New factory address
     */
    event FactoryUpdated(address indexed _oldFactoryAddress, address indexed _newFactoryAddress);

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
        return (1, 2, 0, 0);
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
     */
    function transfer(
        bytes32 _fromUserId,
        bytes32 _toUserId,
        uint256 _value
    )
        external
        greaterThanZero(_value)
        userExist(_fromUserId)
        balanceAvailable(_fromUserId, _value)
        userExist(_toUserId)
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
        returns (bool)
    {
        return _transfer(getWalletAddress(_fromUserId), getWalletAddress(_toUserId), _value);
    }

    function transfer(
        bytes32 _fromUserId,
        address _toAddress,
        uint256 _value
    )
        external
        greaterThanZero(_value)
        userExist(_fromUserId)
        balanceAvailable(_fromUserId, _value)
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
        returns (bool)
    {
        return _transfer(getWalletAddress(_fromUserId), _toAddress, _value);
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
        IWallet(walletAddress).withdraw(_value);
        erc20Token.burn(_value);
        emit UserWithdrawal(_userId, msg.sender, _value);
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
        walletFactory = IWalletFactory(_newFactoryAddress);
        emit FactoryUpdated(address(walletFactory), _newFactoryAddress);
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
        for (i = 0; i < wallets.length(); i = i.add(1)) {
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
}
