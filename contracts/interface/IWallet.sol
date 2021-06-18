// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Celo UBI beneficiary contract interface
 *
 * @dev A simple wallet contract to hold specific ERC20 tokens that is controlled by an owner
 *
 * @author Aaron Boyd <https://github.com/aaronmboyd>
 */
interface IWallet {
    /**
     * @notice Triggered when an amount has been settled for a user
     *
     * @param _userId       Hashed bytes32 of the userId converted to uint256
     * @param _ubiAddress   Celo address of the UBI Beneficiary
     * @param _txId         Raw transaction ID for this event
     * @param _amt          Amount of the transaction
     */
    event SettlementEvent(
        bytes32 indexed _userId,
        address indexed _ubiAddress,
        string _txId,
        uint256 _amt
    );

    /**
     * @notice Used to initialize a new UBIBeneficiary contract
     *
     * @param _cUSDToken token used for cUSD
     * @param _cUBIAuthToken token used for cUSD authorizations
     * @param _userId userId for the UBI beneficiary
     *
     */
    function initialize(
        address _cUSDToken,
        address _cUBIAuthToken,
        address _controller,
        string memory _userId
    ) external;

    /**
     * @notice Return array of settlementKeys
     *
     * @dev Note this is marked external, you cannot return dynamically sized data target is a Web3 caller for iterating Settlements
     *
     */
    function getSettlementKeys() external view returns (bytes32[] memory);


    /**
     * @notice Return the primitive attributes of an Settlement struct
     *
     * @param _key Map key of the Settlement to return
     *
     */
    function getSettlementAtKey(bytes32 _key) external view returns (uint256, string memory);

    /**
     * @notice retrieve available balance for this contract
     *
     * @return uint256 usable balance for this contract
     */
    function availableBalance() external view returns (uint256);

    /**
     * @notice Perform a settlement by returning cUSD token to the reconciliation contract
     *
     * @param _txId Dynamic string txId of the transaction to authorize
     * @param _value uint256 transaction amount
     * @param _reconciliationAccount Reconciliation account to send the cUSD to during settlement
     *
     * @dev If there was an existing authorization for this txId, de-authorize it, for the original authorization amount, regardless of the current settlement amount
     *
     */
    function settle(
        string calldata _txId,
        uint256 _value,
        address _reconciliationAccount
    ) external;

    /**
     * @notice Transfer control of the UBIBeneficiary
     *
     * @param _newController New owner address
     *
     */
    function transferController(address _newController) external;
}
