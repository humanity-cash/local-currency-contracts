const utils = require("web3-utils");
const Controller = artifacts.require("Controller");
const WalletFactory = artifacts.require("WalletFactory");
const Token = artifacts.require("Token");
const Wallet = artifacts.require("Wallet");

const CONTROLLER_ROLE = utils.keccak256("CONTROLLER_ROLE");
const OPERATOR_ROLE = utils.keccak256("OPERATOR_ROLE");
const MINTER_ROLE = utils.keccak256("MINTER_ROLE");
const PAUSER_ROLE = utils.keccak256("PAUSER_ROLE");

const deploy = async (accounts) => {
	const [owner, operator1, operator2] = accounts;
	let controller, walletFactory, token, wallet;

	token = await Token.new("TestToken", "TT");
	wallet = await Wallet.new();
	walletFactory = await WalletFactory.new(token.address, wallet.address);
	controller = await Controller.new(token.address, walletFactory.address);

	await walletFactory.transferOwnership(controller.address);

	await token.grantRole(MINTER_ROLE, controller.address);
	// owner has to revoke its operator role after granting
	await token.renounceRole(MINTER_ROLE, owner);

	await controller.grantRole(OPERATOR_ROLE, operator1);
	await controller.grantRole(OPERATOR_ROLE, operator2);
	// owner has to revoke its operator role after granting
	await controller.renounceRole(OPERATOR_ROLE, owner);

	return {
		wallet,
		controller,
		walletFactory,
		token,
	};
};

module.exports = {
	// controller roles
	OPERATOR_ROLE,
	// token roles
	MINTER_ROLE,
	PAUSER_ROLE,
	// wallet roles
	CONTROLLER_ROLE,
	deploy,
};
