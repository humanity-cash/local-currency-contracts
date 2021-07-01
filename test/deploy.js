const utils = require("web3-utils");
const Controller = artifacts.require("Controller");
const WalletFactory = artifacts.require("WalletFactory");
const Token = artifacts.require("Token");
const Wallet = artifacts.require("Wallet");

module.exports.deploy = async () => {
	let controller, walletFactory, token, wallet;

	token = await Token.new("TestToken", "TT");
	wallet = await Wallet.new();
	walletFactory = await WalletFactory.new(token.address, wallet.address);
	controller = await Controller.new(token.address, walletFactory.address);

	await walletFactory.transferOwnership(controller.address);

	await token.grantRole(utils.keccak256("MINTER_ROLE"), controller.address);

	return {
		wallet,
		controller,
		walletFactory,
		token,
	};
};
