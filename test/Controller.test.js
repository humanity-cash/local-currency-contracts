/* global it, before */
const WalletFactory = artifacts.require("WalletFactory");
const Wallet = artifacts.require("Wallet");
const { toBytes32 } = require("./toBytes32");
const { uuid } = require("uuidv4");
const { deploy } = require("./deploy");

contract("Controller", async (accounts) => {
	const [owner, someone] = accounts;

	let deployment;

	before(async () => {
		deployment = await deploy();
	});

	it("Should read public attributes for important internal addresses", async () => {
		const { controller } = deployment;
		const token = await controller.erc20Token();
		assert(token);
	});

	it("Should have an owner matching the deployer address", async () => {
		const { controller } = deployment;
		const contractOwner = await controller.owner();
		assert.equal(owner, contractOwner, `Owner should be ${owner}`);
	});

	it("Should be able to update factory", async () => {
		const { controller } = deployment;

		const factory = await controller.walletFactory();
		await controller.setWalletFactory(factory);
	});

	it("Should be able to update wallet proxy logic contract after creating 3 new accounts", async () => {
		const { controller } = deployment;

		const newLogic = await Wallet.new();
		await controller.newWallet(toBytes32(uuid()));
		await controller.newWallet(toBytes32(uuid()));
		await controller.newWallet(toBytes32(uuid()));
		await controller.updateWalletImplementation(newLogic.address);
	});

	it("Should be able to update the factory and create a new user", async () => {
		const { controller, token, wallet } = deployment;

		const newFactory = await WalletFactory.new(
			token.address,
			wallet.address
		);
		await controller.setWalletFactory(newFactory.address);
		await controller.newWallet(toBytes32(uuid()));
	});

	it("Should be able to transfer ownership", async () => {
		const { controller } = deployment;

		let user1 = toBytes32(uuid());
		let user2 = toBytes32(uuid());
		let user3 = toBytes32(uuid());

		await controller.newWallet(user1);
		await controller.newWallet(user2);
		await controller.newWallet(user3);
		await controller.transferWalletOwnership(someone, user3);
		await controller.transferWalletOwnership(someone, user2);
		await controller.transferWalletOwnership(someone, user1);

		await controller.transferContractOwnership(someone);
		const contractOwner = await controller.owner();
		assert.equal(someone, contractOwner, `Owner should now be ${someone}`);
	});
});
