// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interface/IWallet.sol";
import "./interface/IVersionedContract.sol";

/**
 * @title Implementation of the Wallet contract
 *
 * @dev A simple wallet contract to hold specific ERC20 tokens that is controlled by an owner
 *
 * @author Aaron Boyd <https://github.com/aaronmboyd>
 * @author Sebastian Gerske <https://github.com/h34d>
 */
contract Wallet is
    IVersionedContract,
    IWallet,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    IERC20 public erc20Token;
    uint256 public createdBlock;
    bytes32 public userId;

    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

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
     * @notice retrieve available balance for this contract
     *
     * @return uint256 usable balance for this contract
     */
    function availableBalance() external view override returns (uint256) {
        return erc20Token.balanceOf(address(this));
    }

    /**********************************************************************
     *
     * Public Methods
     *
     **********************************************************************/

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
        bytes32 _userId
    ) external override initializer {
        erc20Token = IERC20(_erc20Token);
        createdBlock = block.number;
        userId = _userId;

        __ReentrancyGuard_init();
        __AccessControl_init();

        _setupRole(DEFAULT_ADMIN_ROLE, _controller);
        _setupRole(CONTROLLER_ROLE, _controller);
    }

    /**********************************************************************
     *
     * Owner Methods
     *
     **********************************************************************/

    /**
     * @notice Performs a transfer from one wallet to another
     *
     * @param _toWallet     IWallet wallet to transfer to
     * @param _value        uint256 transaction amount
     *
     */
    function transferTo(IWallet _toWallet, uint256 _value)
        external
        override
        onlyRole(CONTROLLER_ROLE)
        nonReentrant
        returns (bool)
    {
        address toAddress = address(_toWallet);
        bool success = erc20Token.transfer(toAddress, _value);
        return success;
    }

    /**
     * @notice Performs a withdrawal to the controller
     *
     * @param _value        uint256 withdrawal amount
     *
     */
    function withdraw(uint256 _value)
        external
        override
        onlyRole(CONTROLLER_ROLE)
        nonReentrant
        returns (bool)
    {
        bool success = erc20Token.transfer(msg.sender, _value);
        return success;
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
        onlyRole(CONTROLLER_ROLE)
    {
        grantRole(DEFAULT_ADMIN_ROLE, _newController);
        grantRole(CONTROLLER_ROLE, _newController);
        revokeRole(CONTROLLER_ROLE, msg.sender);
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
