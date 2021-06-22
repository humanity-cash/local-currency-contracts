// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interface/IWallet.sol";
import "./interface/IVersionedContract.sol";

/**
 * @title Implementation of the Wallet contract
 *
 * @dev A simple wallet contract to hold specific ERC20 tokens that is controlled by an owner
 *
 * @author Aaron Boyd <https://github.com/aaronmboyd>
 */
contract Wallet is
    IVersionedContract,
    IWallet,
    AccessControl,
    Initializable,
    ReentrancyGuard
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeERC20 for ERC20PresetMinterPauser;

    IERC20 public erc20Token;
    uint256 public createdBlock;
    string public userId;

    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");

    struct Settlement {
        uint256 value;
        string txId;
    }

    mapping(bytes32 => Settlement) private settlements;
    bytes32[] private settlementKeys;

    /**
     * @notice Returns the storage, major, minor, and patch version of the contract.
     * @return The storage, major, minor, and patch version of the contract.
     */
    function getVersionNumber()
        external
        pure
        virtual
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
     * @notice Enforces only controller can perform action
     */
    modifier onlyController(address operator) {
        require(hasRole(CONTROLLER_ROLE, operator), "ERR_ONLY_CONTROLLER");
        _;
    }

    /**
     * @notice used to initialize a new Wallet contract
     *
     * @param _erc20Token token used
     * @param _controller Address of the controller contract
     * @param _userId userId for the wallet
     */
    function initialize(
        address _erc20Token,
        address _controller,
        string memory _userId
    ) external override initializer {
        erc20Token = IERC20(_erc20Token);
        createdBlock = block.number;
        userId = _userId;

        _setupRole(CONTROLLER_ROLE, _controller);
        _setupRole(DEFAULT_ADMIN_ROLE, _controller);
        _setupRole(FACTORY_ROLE, msg.sender);
    }

    /**
     * @notice Return array of settlementKeys
     *
     * @dev Note this is marked external, you cannot return dynamically sized data target is a Web3 caller for iterating Settlements
     *
     */
    function getSettlementKeys() external view override returns (bytes32[] memory) {
        return settlementKeys;
    }

    /**
     * @notice Return the primitive attributes of an Settlement struct
     *
     * @param _key Map key of the Settlement to return
     *
     */
    function getSettlementAtKey(bytes32 _key)
        external
        view
        override
        returns (uint256, string memory)
    {
        Settlement memory s = settlements[_key];
        return (s.value, s.txId);
    }

    /**
     * @notice retrieve available balance for this contract
     *
     * @return uint256 usable balance for this contract
     */
    function availableBalance() external view override returns (uint256) {
        return erc20Token.balanceOf(address(this));
    }


    /**
     * @notice Perform a settlement by returning token to the wallet contract
     *
     * @param _txId Dynamic string txId of the transaction to authorize
     * @param _value uint256 transaction amount
     *
     * @dev If there was an existing authorization for this txId, de-authorize it, for the original authorization amount, regardless of the current settlement amount
     *
     */
    function settle(
        string calldata _txId,
        uint256 _value
    ) external override onlyController(msg.sender) nonReentrant {
        bytes32 key = keccak256(bytes(_txId));
        require(settlements[key].value == 0, "ERR_SETTLE_EXISTS");

        // Then perform settlement
        settlementKeys.push(key);
        Settlement storage newSettle = settlements[key];
        newSettle.txId = _txId;
        newSettle.value = _value;

        emit SettlementEvent(keccak256(bytes(userId)), address(this), _txId, _value);
    }

    /**
     * @notice Transfer control of the controller
     *
     * @param _newController New owner address
     *
     */
    function transferController(address _newController)
        external
        override
        onlyController(msg.sender)
    {
        grantRole(DEFAULT_ADMIN_ROLE, _newController);
        grantRole(CONTROLLER_ROLE, _newController);
        revokeRole(CONTROLLER_ROLE, msg.sender);
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
