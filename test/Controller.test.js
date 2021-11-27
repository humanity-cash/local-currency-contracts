/* global it, before */
const WalletFactory = artifacts.require("WalletFactory");
const Wallet = artifacts.require("Wallet");
const { toBytes32 } = require("./toBytes32");
const { uuid } = require("uuidv4");
const { deploy } = require("./deploy");
const truffleAssert = require("truffle-assertions");

contract("Controller", async (accounts) => {
	const [owner, operator1, , , , someone] = accounts;

	let deployment;

	before(async () => {
		deployment = await deploy(accounts);
	});

	it("Should read public local currency token address", async () => {
		const { controller } = deployment;
		const token = await controller.erc20Token();
		assert(token);
	});

	it("Should read public community chest address", async () => {
		const { controller } = deployment;
		const communityChestAddress = await controller.communityChestAddress();
		assert(communityChestAddress);
	});

	it("Should not be able to set community chest address not as owner", async () => {
		const { controller } = deployment;
		await truffleAssert.reverts(
			controller.setCommunityChest(
				"0x211969720ae21A22676047908C8AfDF93100d588",
				{ from: someone }
			),
			"Ownable: caller is not the owner."
		);
	});

	it("Should be able to set community chest address", async () => {
		const { controller } = deployment;
		await controller.setCommunityChest(
			"0x211969720ae21A22676047908C8AfDF93100d588",
			{ from: owner }
		);
	});

	it("Should be able to set community chest address again", async () => {
		const { controller } = deployment;
		const communityChestAddress = await controller.communityChestAddress();
		await controller.setCommunityChest(communityChestAddress, {
			from: owner,
		});
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
		await controller.newWallet(toBytes32(uuid()), { from: operator1 });
		await controller.newWallet(toBytes32(uuid()), { from: operator1 });
		await controller.newWallet(toBytes32(uuid()), { from: operator1 });
		await controller.updateWalletImplementation(newLogic.address);
	});

	it("Should be able to update the factory and create a new user", async () => {
		const { controller, token, wallet } = deployment;

		const newFactory = await WalletFactory.new(
			token.address,
			wallet.address
		);
		await controller.setWalletFactory(newFactory.address);
		await controller.newWallet(toBytes32(uuid()), { from: operator1 });
	});

	it("Should be able to transfer ownership", async () => {
		const { controller } = deployment;

		let user1 = toBytes32(uuid());
		let user2 = toBytes32(uuid());
		let user3 = toBytes32(uuid());

		await controller.newWallet(user1, { from: operator1 });
		await controller.newWallet(user2, { from: operator1 });
		await controller.newWallet(user3, { from: operator1 });
		await controller.transferWalletOwnership(someone, user3);
		await controller.transferWalletOwnership(someone, user2);
		await controller.transferWalletOwnership(someone, user1);

		await controller.transferContractOwnership(someone);
		const contractOwner = await controller.owner();
		assert.equal(someone, contractOwner, `Owner should now be ${someone}`);
	});
});
