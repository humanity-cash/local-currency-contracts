const WalletFactory = artifacts.require("WalletFactory");
const Wallet = artifacts.require("Wallet");
const Web3 = require("web3");
const truffleAssert = require("truffle-assertions");
const { deploy } = require("./deploy");
const Web3Utils = require('web3-utils');
const { uuid } = require("uuidv4");

function toBytes32(input) {
	return Web3Utils.keccak256(input);
}

contract("Controller", async (accounts) => {
	const owner = accounts[0];

	let controller, factory, testToken, wallet;

	before(async () => {
		let deployment = await deploy();

		wallet = deployment.wallet;
		controller = deployment.controller;
		factory = deployment.factory;
		testToken = deployment.testToken;
	});

	it("Should read public attributes for important internal addresses", async () => {
		const token = await controller.erc20Token();
		assert(token);
	});

	it("Should have an owner matching the deployer address", async () => {
		const contractOwner = await controller.owner();
		assert.equal(owner, contractOwner, `Owner should be ${owner}`);
	});

	it("Should be able to update factory", async () => {
		const factory = await controller.walletFactory();
		await controller.setWalletFactory(factory);
	});

	it("Should be able to pause", async () => {
		await controller.pause();
	});

	it("Should be able to unpause", async () => {
		await controller.unpause();
	});

	it("Should be able to update wallet proxy logic contract after creating 3 new accounts", async () => {
		const newLogic = await Wallet.new();
		await controller.newWallet(uuid());
		await controller.newWallet(uuid());
		await controller.newWallet(uuid());
		await controller.updateWalletImplementation(newLogic.address);
	});

	it("Should be able to update the factory and create a new user", async () => {
		const newFactory = await WalletFactory.new(
			wallet.address,
			testToken.address
		);
		await controller.setWalletFactory(newFactory.address);
		await controller.newWallet(uuid());
	});

	it("Should be able to emergency withdraw after pausing", async () => {
		await controller.pause();
		await controller.withdrawToOwner();
		await controller.unpause();

		const controllerBalanceOfNew = await testToken.balanceOf(
			controller.address
		);

		assert.equal(
			controllerBalanceOfNew,
			0,
			`Walllet token balance should be ${0}`
		);
	});

	it("Should be able to transfer ownership", async () => {
		// Re-mint some test token to continue testing
		await testToken.mint(
			controller.address,
			Web3.utils.toWei("10000000", "ether")
		);
		let user1 = uuid();
		let user2 = uuid();
		let user3 = uuid();

		await controller.newWallet(user1);
		await controller.newWallet(user2);
		await controller.newWallet(user3);
		await controller.transferWalletOwnership(accounts[1], toBytes32(user3));
		await controller.transferWalletOwnership(accounts[1], toBytes32(user2));
		await controller.transferWalletOwnership(accounts[1], toBytes32(user1));

		await controller.transferContractOwnership(accounts[1]);
		const contractOwner = await controller.owner();
		assert.equal(
			accounts[1],
			contractOwner,
			`Owner should now be ${accounts[1]}`
		);
	});
});
