// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

/**
 * @title Controller interface contract
 *
 * @dev Administrative and orchestrator contract for local currencies
 *
 * @author Aaron Boyd <https://github.com/aaronmboyd>
 * @author Sebastian Gerske <https://github.com/h34d>
 */
interface IController {
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
     * @notice Triggered when a round up has been sent from one account to another
     *
     * @param _fromUserId       Hashed bytes32 of the sender
     * @param _toAddress        Address of the receiver
     * @param _amt              Amount of the transaction
     */
    event RoundUpEvent(bytes32 indexed _fromUserId, address indexed _toAddress, uint256 _amt);

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
     * @notice Triggered when the Redemption Fee Minimum is updated
     *
     * @param _oldRedemptionFeeMinimum  Old redemption fee minimum
     * @param _newRedemptionFeeMinimum  New redemption fee minimum
     */
    event RedemptionFeeMinimumUpdated(
        uint256 _oldRedemptionFeeMinimum,
        uint256 _newRedemptionFeeMinimum
    );

    /**
     * @notice Triggered when a redemption (withdrawal) fee is collected
     *
     * @param _redemptionFeeAddress   Recipient of the fee (the humanityCashAddress)
     * @param _redemptionFee          New factory address
     */
    event RedemptionFee(address indexed _redemptionFeeAddress, uint256 _redemptionFee);

    /**********************************************************************
     *
     * View Methods
     *
     **********************************************************************/

    /**
     * @notice Retrieves the available balance of a wallet
     *
     * @param _userId user identifier
     * @return uint256 available balance
     */
    function balanceOfWallet(bytes32 _userId) external view returns (uint256);

    /**
     * @notice Retrieves the available balance of a wallet
     *
     * @param _walletAddress wallet address
     * @return uint256 available balance
     */
    function balanceOfWallet(address _walletAddress) external view returns (uint256);

    /**
     * @notice retrieve contract address for a Wallet
     *
     * @param _userId user identifier
     * @return address of user's contract
     */
    function getWalletAddress(bytes32 _userId) external view returns (address);

    /**
     * @notice Get wallet address at index
     * @dev Used for iterating the complete list of wallets
     *
     */
    function getWalletAddressAtIndex(uint256 _index) external view returns (address);

    /**
     * @notice Get count of wallets
     *
     */
    function getWalletCount() external view returns (uint256);

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
    ) external returns (bool);

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
    ) external returns (bool);

    /**
     * @notice Deposits tokens in the wallet identified by the given user id
     *
     * @param _userId   User identifier
     * @param _value    Amount to deposit
     */
    function deposit(bytes32 _userId, uint256 _value) external returns (bool);

    /**
     * @notice Withdraws tokens from the wallet identified by the given user id
     *
     * @param _userId   User identifier
     * @param _value    Amount to withdraw
     */
    function withdraw(bytes32 _userId, uint256 _value) external returns (bool);

    /**
     * @notice create a new user and assign them a wallet contract
     *
     * @param _userId user identifier
     */
    function newWallet(bytes32 _userId) external;

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
    function setWalletFactory(address _newFactoryAddress) external;

    /**
     * @notice Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     *
     *
     * @param newOwner new owner of this contract
     *
     */
    function transferContractOwnership(address newOwner) external;

    /**
     * @notice Transfers ownership of the wallet to a new account (`newOwner`).
     * Can only be called by the current owner.
     *
     *
     * @param newOwner new owner of wallet
     * @param userId current owner of the wallet
     *
     */
    function transferWalletOwnership(address newOwner, bytes32 userId) external;

    /**
     * @notice Update implementation address for wallets
     *
     * @param _newLogic New implementation logic for wallet proxies
     *
     */
    function updateWalletImplementation(address _newLogic) external;

    /**
     * @notice Triggers stopped state.
     *
     * @dev Requirements: The contract must not be paused.
     */
    function pause() external;

    /**
     * @notice Returns to normal state.
     *
     * @dev Requirements: The contract must be paused.
     */
    function unpause() external;

    /**
     * @notice Emergency withdrawal of all remaining token to the owner account
     *
     * @dev The contract must be paused
     * @dev Sends erc20 to current owner
     */
    function withdrawToOwner() external;

    /** override onlyOwner {  
     * @notice Update community chest address
     *
     * @param _communityChest new address
     */
    function setCommunityChest(address _communityChest) external;

    /**
     * @notice Update Humanity Cash Address
     *
     * @param _humanityCashAddress new address
     */
    function setHumanityCashAddress(address _humanityCashAddress) external;

    /**
     * @notice Set redemption fee
     *
     * @param _numerator   Redemption fee numerator
     * @param _denominator Redemption fee denominator
     */
    function setRedemptionFee(int256 _numerator, int256 _denominator) external;


    /**
     * @notice Set redemption fee minimum
     *
     * @param _redemptionFeeMinimum   Redemption fee minimum
     */
    function setRedemptionFeeMinimum(uint256 _redemptionFeeMinimum) external;
}
