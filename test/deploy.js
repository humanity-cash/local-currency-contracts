const Web3 = require("web3");
const Controller = artifacts.require("Controller");
const WalletFactory = artifacts.require("WalletFactory");
const ERC20 = artifacts.require("ERC20PresetMinterPauser");
const Wallet = artifacts.require("Wallet");

module.exports.deploy = async () => {
	let controller, factory, cUSDTestToken, cUBIAuthToken;

	cUSDTestToken = await ERC20.new("cUSD", "cUSD");

	let wallet = await Wallet.deployed();

	factory = await WalletFactory.new(wallet.address, cUSDTestToken.address);

	controller = await Controller.new(cUSDTestToken.address, factory.address);

	await factory.transferOwnership(controller.address);

	await cUSDTestToken.mint(
		controller.address,
		Web3.utils.toWei("10000000", "ether")
	);

	return {
		wallet,
		controller,
		factory,
		cUSDTestToken,
	};
};
