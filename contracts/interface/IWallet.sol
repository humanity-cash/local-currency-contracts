// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Wallet contract interface
 *
 * @dev A simple wallet contract to hold specific ERC20 tokens that is controlled by an owner
 *
 * @author Aaron Boyd <https://github.com/aaronmboyd>
 * @author Sebastian Gerske <https://github.com/h34d>
 */
interface IWallet {
    /**
     * @notice Triggered when an amount has been transferred from one wallet to another
     *
     * @param _fromUserId       Hashed bytes32 of the sender
     * @param _toUserId         Hashed bytes32 of the receiver
     * @param _amt              Amount of the transaction
     */
    event TransferToEvent(bytes32 indexed _fromUserId, bytes32 indexed _toUserId, uint256 _amt);

    /**
     * @notice Used to initialize a new Wallet contract
     *
     * @param _erc20token token used
     * @param _userId userId for the wallet
     *
     */
    function initialize(
        address _erc20token,
        address _controller,
        bytes32 _userId
    ) external;

    /**
     * @notice retrieve available balance for this contract
     *
     * @return uint256 usable balance for this contract
     */
    function availableBalance() external view returns (uint256);

    /**
     * @notice Performs a transfer from one wallet to another
     *
     * @param _toWallet     IWallet wallet to transfer to
     * @param _value        uint256 transaction amount
     *
     */
    function transferTo(IWallet _toWallet, uint256 _value) external returns (bool);

    /**
     * @notice Transfer control of the controller
     *
     * @param _newController New owner address
     *
     */
    function transferController(address _newController) external;
}
