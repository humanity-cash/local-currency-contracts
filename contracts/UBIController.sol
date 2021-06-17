// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "./interface/IUBIBeneficiary.sol";
import "./interface/IUBIReconciliationAccount.sol";
import "./interface/IUBIBeneficiaryFactory.sol";
import "./interface/IVersionedContract.sol";

/**
 * @title Celo UBI administrative contract
 *
 * @dev Administrative and orchestrator contract for the Celo UBI program
 *
 * @author Aaron Boyd <https://github.com/aaronmboyd>
 */
contract UBIController is IVersionedContract, Ownable, Pausable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeERC20 for ERC20PresetMinterPauser;
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    /**
     * @notice Triggered when a new user has been created
     *
     * @param _userId       Hashed bytes32 of the userId
     * @param _ubiAddress   Celo address of the UBI Beneficiary
     */
    event NewUser(bytes32 indexed _userId, address indexed _ubiAddress);

    /**
     * @notice Triggered when the disbursement amount is changed
     *
     * @param _disbursementWei   New value of wei to disburse to beneficiaries
     */
    event DisbursementUpdated(uint256 indexed _disbursementWei);

    /**
     * @notice Triggered when the UBI Beneficiary Factory is updated
     *
     * @param _oldFactoryAddress   Old factory address
     * @param _newFactoryAddress   New factory address
     */
    event FactoryUpdated(address indexed _oldFactoryAddress, address indexed _newFactoryAddress);

    IERC20 public cUSDToken;
    ERC20PresetMinterPauser public cUBIAuthToken;
    IUBIBeneficiaryFactory public ubiFactory;
    IUBIReconciliationAccount public reconciliationAccount;

    // Default disbursement amount
    uint256 public disbursementWei = 100 ether;

    // Mapping of UBI Beneficiary identifiers to their contract address
    EnumerableMap.UintToAddressMap private ubiBeneficiaries;

    /**
     * @notice Used to initialize a new UBIController contract
     *
     * @param _cUSDToken token used for cUSD
     */
    constructor(
        address _cUSDToken,
        address _cUBIAuthToken,
        address _factory,
        address _custodian
    ) {
        cUSDToken = IERC20(_cUSDToken);
        cUBIAuthToken = ERC20PresetMinterPauser(_cUBIAuthToken);
        ubiFactory = IUBIBeneficiaryFactory(_factory);
        address tmp = ubiFactory.createProxiedUBIReconciliationAccount(_custodian);
        reconciliationAccount = IUBIReconciliationAccount(tmp);
    }

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
        require(balanceOfUBIBeneficiary(_userId) >= _value, "ERR_NO_BALANCE");
        _;
    }

    /**
     * @notice Enforces a _userId should not be mapped to an existing user / contract address
     */
    modifier userNotExist(bytes32 _userId) {
        require(!ubiBeneficiaries.contains(uint256(_userId)), "ERR_USER_EXISTS");
        _;
    }

    /**
     * @notice Set amount of wei to disburse to new beneficiaries
     *
     * @param _newDisbursementWei   disbursement amount in wei
     */
    function setDisbursementWei(uint256 _newDisbursementWei) external onlyOwner {
        disbursementWei = _newDisbursementWei;
        emit DisbursementUpdated(disbursementWei);
    }

    /**
     * @notice Public update to a new UBI Beneficiary Factory
     *
     * @param _newFactoryAddress   new factory address
     */
    function setUBIBeneficiaryFactory(address _newFactoryAddress) external onlyOwner {
        _setUBIBeneficiaryFactory(_newFactoryAddress);
    }

    /**
     * @notice Internal implementation of update to a new UBI Beneficiary Factory
     *
     * @param _newFactoryAddress   new factory address
     */
    function _setUBIBeneficiaryFactory(address _newFactoryAddress) private {
        ubiFactory = IUBIBeneficiaryFactory(_newFactoryAddress);
        emit FactoryUpdated(address(ubiFactory), _newFactoryAddress);
    }

    /**
     * @notice Update the custodian address
     *
     * @param _custodian   new custodian address
     */
    function setCustodian(address _custodian) external onlyOwner {
        reconciliationAccount.setCustodian(_custodian);
    }

    /**
     * @notice Retrieves the available balance of a UBI beneficiary
     *
     * @param _userId user identifier
     * @return uint256 available balance
     */
    function balanceOfUBIBeneficiary(bytes32 _userId) public view returns (uint256) {
        address ubiBeneficiaryAddress = ubiBeneficiaries.get(uint256(_userId));
        IUBIBeneficiary user = IUBIBeneficiary(ubiBeneficiaryAddress);
        return user.availableBalance();
    }

    /**
     * @notice Retrieves the authorized balance of a UBI beneficiary
     *
     * @param _userId user identifier
     * @return uint256 authorized balance
     */
    function authBalanceOfUBIBeneficiary(bytes32 _userId) public view returns (uint256) {
        address ubiBeneficiaryAddress = ubiBeneficiaries.get(uint256(_userId));
        IUBIBeneficiary user = IUBIBeneficiary(ubiBeneficiaryAddress);
        return user.authorizationBalance();
    }

    /**
     * @notice Authorizes an amount for a UBI beneficiary
     *
     * @param _userId       User identifier
     * @param _txId         Raw transaction ID for this event
     * @param _value        Amount to authorize
     */
    function authorize(
        bytes32 _userId,
        string calldata _txId,
        uint256 _value
    )
        external
        greaterThanZero(_value)
        balanceAvailable(_userId, _value)
        onlyOwner
        nonReentrant
        whenNotPaused
    {
        address ubiBeneficiaryAddress = ubiBeneficiaries.get(uint256(_userId));
        cUBIAuthToken.mint(ubiBeneficiaryAddress, _value);

        IUBIBeneficiary user = IUBIBeneficiary(ubiBeneficiaryAddress);
        user.authorize(_txId, _value);
    }

    /**
     * @notice Deauthorizes an amount for a UBI beneficiary
     *
     * @param _userId       User identifier
     * @param _txId         Raw transaction ID for this event
     */
    function deauthorize(bytes32 _userId, string calldata _txId)
        external
        onlyOwner
        nonReentrant
        whenNotPaused
    {
        _deauthorize(uint256(_userId), _txId);
    }

    /**
     * @notice Deauthorizes an amount for a UBI beneficiary
     * @dev Implementation of external "deauthorize" function so that it may be called internally without reentrancy guard incrementing
     *
     * @param _userId       User identifier
     * @param _txId         Raw transaction ID for this event
     */
    function _deauthorize(uint256 _userId, string calldata _txId) private {
        address ubiBeneficiaryAddress = ubiBeneficiaries.get(_userId);
        IUBIBeneficiary user = IUBIBeneficiary(ubiBeneficiaryAddress);
        uint256 deauthorizedAmt = user.deauthorize(_txId);
        cUBIAuthToken.burn(deauthorizedAmt);
    }

    /**
     * @notice Settles an amount for a UBI Beneficiary and transfers to the Reconciliation account
     *
     * @param _userId       User identifier
     * @param _txId         Raw transaction ID for this event
     * @param _value        Amount to settle
     */
    function settle(
        bytes32 _userId,
        string calldata _txId,
        uint256 _value
    )
        external
        greaterThanZero(_value)
        balanceAvailable(_userId, _value)
        onlyOwner
        nonReentrant
        whenNotPaused
    {
        _settle(uint256(_userId), _txId, _value);
    }

    /**
     * @notice Settles an amount for a UBI Beneficiary and transfers to the Reconciliation account
     * @dev Implementation of external "settle" function so that it may be called internally without reentrancy guard incrementing
     *
     * @param _userId       User identifier
     * @param _txId         Raw transaction ID for this event
     * @param _value        Amount to settle
     */
    function _settle(
        uint256 _userId,
        string calldata _txId,
        uint256 _value
    ) private {
        address ubiBeneficiaryAddress = ubiBeneficiaries.get(_userId);
        IUBIBeneficiary user = IUBIBeneficiary(ubiBeneficiaryAddress);
        user.settle(_txId, _value, address(reconciliationAccount));
    }

    /**
     * @notice Reconciles cUSD built up in reconciliation account and sends to pre-configured custodian
     *
     */
    function reconcile() external onlyOwner nonReentrant whenNotPaused {
        reconciliationAccount.reconcile();
    }

    /**
     * @notice create a new user and assign them a wallet contract
     *
     * @param _userId user identifier
     */
    function newUbiBeneficiary(string calldata _userId)
        external
        onlyOwner
        nonReentrant
        whenNotPaused
        userNotExist(keccak256(bytes(_userId)))
    {
        address newUBIBeneficiaryAddress = ubiFactory.createProxiedUBIBeneficiary(_userId);
        bytes32 key = keccak256(bytes(_userId));
        ubiBeneficiaries.set(uint256(key), newUBIBeneficiaryAddress);
        cUSDToken.transfer(newUBIBeneficiaryAddress, disbursementWei);

        emit NewUser(key, newUBIBeneficiaryAddress);
    }

    /**
     * @notice retrieve contract address for a UBI Beneficiary
     *
     * @param _userId user identifier
     * @return address of user's contract
     */
    function beneficiaryAddress(bytes32 _userId) public view returns (address) {
        return ubiBeneficiaries.get(uint256(_userId), "ERR_USER_NOT_EXIST");
    }

    /**
     * @notice Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     *
     * @dev In this override, we iterate all the existing UBIBeneficiary contracts
     * and change their owner before changing the owner of the core contract
     *
     * @param newOwner new owner of this contract
     * @inheritdoc Ownable
     *
     */
    function transferOwnership(address newOwner) public override onlyOwner {
        // 1 Update owner on all UBIBeneficiary contracts
        uint256 i;
        for (i = 0; i < ubiBeneficiaries.length(); i = i.add(1)) {
            address ubiBeneficiaryAddress;

            // .at function returns a tuple of (uint256, address)
            (, ubiBeneficiaryAddress) = ubiBeneficiaries.at(i);

            IUBIBeneficiary user = IUBIBeneficiary(ubiBeneficiaryAddress);
            user.transferController(newOwner);
        }

        // 2 Update reconciliation account owner, cast it as a
        //      IUBIBeneficiary to use the transferController function
        IUBIBeneficiary(address(reconciliationAccount)).transferController(newOwner);

        // 3 Update owner of this contract
        super.transferOwnership(newOwner);
    }

    /**
     * @notice Update implementation address for beneficiaries
     *
     * @param _newLogic New implementation logic for beneficiary proxies
     *
     */
    function updateBeneficiaryImplementation(address _newLogic) external onlyOwner {
        uint256 i;
        for (i = 0; i < ubiBeneficiaries.length(); i = i.add(1)) {
            address ubiBeneficiaryAddress;
            // .at function returns a tuple of (uint256, address)
            (, ubiBeneficiaryAddress) = ubiBeneficiaries.at(i);
            ubiFactory.updateProxyImplementation(ubiBeneficiaryAddress, _newLogic);
        }
    }

    /**
     * @notice Update implementation address for reconciliationAccount
     *
     * @param _newLogic New implementation logic for reconciliationAccount
     *
     */
    function updateReconciliationImplementation(address _newLogic) external onlyOwner {
        ubiFactory.updateProxyImplementation(address(reconciliationAccount), _newLogic);
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
     * @notice Emergency withdrawal of all remaining cUSD to the custodian account
     *
     * @dev The contract must be paused
     * @dev Sends cUSD to current custodian from the current reconciliation account
     */
    function withdrawToCustodian() external onlyOwner whenPaused nonReentrant {
        uint256 balanceOf = cUSDToken.balanceOf(address(this));
        address custodian = reconciliationAccount.getCustodian();
        cUSDToken.transfer(custodian, balanceOf);
    }

    /**
     * @notice Emergency withdrawal of all remaining cUSD to the owner account
     *
     * @dev The contract must be paused
     * @dev Sends cUSD to current owner
     */
    function withdrawToOwner() external onlyOwner whenPaused nonReentrant {
        uint256 balanceOf = cUSDToken.balanceOf(address(this));
        cUSDToken.transfer(owner(), balanceOf);
    }

    /**
     * @notice Get beneficiary address at index
     * @dev Used for iterating the complete list of beneficiaries
     *
     */
    function getBeneficiaryAddressAtIndex(uint256 _index) external view returns (address) {
        // .at function returns a tuple of (uint256, address)
        address ubiBeneficiaryAddress;
        (, ubiBeneficiaryAddress) = ubiBeneficiaries.at(_index);

        return ubiBeneficiaryAddress;
    }

    /**
     * @notice Get count of beneficiaries
     *
     */
    function getBeneficiaryCount() external view returns (uint256) {
        return ubiBeneficiaries.length();
    }
}
