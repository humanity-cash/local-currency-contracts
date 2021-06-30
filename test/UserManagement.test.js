const Wallet = artifacts.require("Wallet");
const truffleAssert = require("truffle-assertions");
const { deploy } = require("./deploy");
const { uuid } = require("uuidv4");
const utils = require("web3-utils");
const { toBytes32 } = require("./toBytes32");

contract("User Management", async (accounts) => {
	let controller, user1, walletFactory, testToken;

	before(async () => {
		let deployment = await deploy();

		controller = deployment.controller;
		walletFactory = deployment.walletFactory;
		testToken = deployment.testToken;

		user1 = toBytes32(uuid());
		await controller.newWallet(user1);
	});

	it("Should verify Controller contract has token balance", async () => {
		const amount = utils.toWei("1", "ether");
		await testToken.mint(controller.address, amount);
		const balance = await testToken.balanceOf(controller.address);
		assert.equal(balance.toString(), amount);
	});

	it("Should not create a user that already exists", async () => {
		await truffleAssert.fails(
			controller.newWallet(user1),
			truffleAssert.ErrorType.REVERT
		);
	});

	it("Should create three more users and count a total", async () => {
		let user2 = toBytes32(uuid());
		await controller.newWallet(user2);

		let user3 = toBytes32(uuid());
		await controller.newWallet(user3);

		const walletCount = await controller.getWalletCount();
		assert.equal(walletCount, 3);
	});

	it("Should iterate the users", async () => {
		const walletCount = await controller.getWalletCount();

		let users = [];
		for (let i = 0; i < walletCount; i++) {
			const address = await controller.getWalletAddressAtIndex(i);
			const wallet = new web3.eth.Contract(Wallet.abi, address);
			const userId = await wallet.methods.userId().call();
			const createdBlock = await wallet.methods.createdBlock().call();
			users.push({
				userId: userId,
				address: address,
				createdBlock: createdBlock,
			});
		}
		// console.log(users);
		assert(users);
		assert.equal(users.length, 3);
	});
});
