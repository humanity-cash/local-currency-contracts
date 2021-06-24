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
 */
contract Controller is IVersionedContract, Ownable, Pausable, ReentrancyGuard {
		using SafeMath for uint256;
		using SafeERC20 for IERC20;
		using SafeERC20 for ERC20PresetMinterPauser;
		using EnumerableMap for EnumerableMap.UintToAddressMap;

		/**
		 * @notice Triggered when a new user has been created
		 *
		 * @param _userId           Hashed bytes32 of the userId
		 * @param _walletAddress    Address of the wallet
		 */
		event NewUser(bytes32 indexed _userId, address indexed _walletAddress);

		/**
		 * @notice Triggered when the Wallet Factory is updated
		 *
		 * @param _oldFactoryAddress   Old factory address
		 * @param _newFactoryAddress   New factory address
		 */
		event FactoryUpdated(address indexed _oldFactoryAddress, address indexed _newFactoryAddress);

		IERC20 public erc20Token;
		IWalletFactory public walletFactory;

		// Mapping of Wallet identifiers to their contract address
		EnumerableMap.UintToAddressMap private wallets;

		/**
		 * @notice Used to initialize a new Controller contract
		 *
		 * @param _erc20Token token used
		 */
		constructor(
				address _erc20Token,
				address _factory
		)
		{
				erc20Token = IERC20(_erc20Token);
				walletFactory = IWalletFactory(_factory);
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
		* @notice Retrieves the available balance of a wallet
		*
				* @param _userId user identifier
		* @return uint256 available balance
		*/
		function balanceOfWallet(bytes32 _userId) public view returns (uint256) {
				address walletAddress = wallets.get(uint256(_userId));
				IWallet wallet = IWallet(walletAddress);
				return wallet.availableBalance();
		}

		/**
		* @notice Settles an amount for a wallet and transfers to the wallet contract
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
		* @notice Settles an amount for a wallet and transfers to the wallet contract
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
				address tmpWalletAddress = wallets.get(_userId);
				IWallet user = IWallet(tmpWalletAddress);
				user.settle(_txId, _value);
		}

		/**
		* @notice create a new user and assign them a wallet contract
		*
				* @param _userId user identifier
		*/
		function newWallet(string calldata _userId)
		external
		onlyOwner
		nonReentrant
		whenNotPaused
		userNotExist(keccak256(bytes(_userId)))
		{
				address newWalletAddress = walletFactory.createProxiedWallet(_userId);
				bytes32 key = keccak256(bytes(_userId));
				wallets.set(uint256(key), newWalletAddress);

				emit NewUser(key, newWalletAddress);
		}

		/**
		* @notice retrieve contract address for a Wallet
		*
		* @param _userId user identifier
		* @return address of user's contract
		 */

		function getWalletAddress(bytes32 _userId) public view returns (address) {
				return wallets.get(uint256(_userId), "ERR_USER_NOT_EXIST");
		}

		function transferContractOwnership(address newOwner) public onlyOwner {
				super.transferOwnership(newOwner);
		}

		function transferWalletOwnership(address newOwner, bytes32 uid) public  onlyOwner {
				address walletAddress = wallets.get(uint256(uid));
				IWallet user = IWallet(walletAddress);
				user.transferController(newOwner);
		}

		// /**
		// * @notice Transfers ownership of the contract to a new account (`newOwner`).
		// * Can only be called by the current owner.
		// *
		// * @dev In this override, we iterate all the existing Wallet contracts
		// * and change their owner before changing the owner of the core contract
		// *
		// * @param newOwner new owner of this contract
		// * @inheritdoc Ownable
		// *
		//  */

		function getReal() public view returns (address) {
				address walletAddress;
				(, walletAddress) = wallets.at(0);
				return walletAddress;
		}

		function transferOwnership(address newOwner) public override onlyOwner {
				// 1 Update owner on all Wallet contracts
				uint256 i;
				address result;
				for (i = 0; i < wallets.length(); i = i.add(1)) {
						address walletAddress;

						// .at function returns a tuple of (uint256, address)
						(, walletAddress) = wallets.at(i);

						IWallet user = IWallet(walletAddress);

						user.transferController(newOwner);
						result = walletAddress;
				}

				// 2 Update owner of this contract
				super.transferOwnership(newOwner);
		}

		/**
		* @notice Update implementation address for beneficiaries
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

		/**
		* @notice Get wallet address at index
		* @dev Used for iterating the complete list of beneficiaries
				*
				*/
		function getWalletAddressAtIndex(uint256 _index) external view returns (address) {
				// .at function returns a tuple of (uint256, address)
				address walletAddress;
				(, walletAddress) = wallets.at(_index);

				return walletAddress;
		}

		/**
		* @notice Get count of beneficiaries
		*
				*/
		function getWalletCount() external view returns (uint256) {
				return wallets.length();
		}
}
