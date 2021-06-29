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
		await testToken.mint(controller.address, utils.toWei("1", "ether"));
		const balance = await testToken.balanceOf(controller.address);
		assert(balance > 0);
	});

	it("Should not create a user that already exists", async () => {
		await truffleAssert.fails(
			controller.newWallet(user1),
			truffleAssert.ErrorType.REVERT
		);
	});

	it("Should create three more users and count a total", async () => {
		let user2 = uuid();
		await controller.newWallet(toBytes32(user2));

		let user3 = uuid();
		await controller.newWallet(toBytes32(user3));

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
