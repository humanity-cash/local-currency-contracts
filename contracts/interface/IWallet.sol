// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

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
     * @notice Performs a withdrawal to the controller
     *
     * @param _value        uint256 transaction amount
     *
     */
    function withdraw(uint256 _value) external returns (bool);

    /**
     * @notice Transfer control of the controller
     *
     * @param _newController New owner address
     *
     */
    function transferController(address _newController) external;
}
