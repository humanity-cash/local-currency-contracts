const Wallet = artifacts.require("Wallet");
const truffleAssert = require("truffle-assertions");
const { deploy } = require("./deploy");
const { uuid } = require("uuidv4");

contract("User Management", async (accounts) => {
	let controller, tokenMinted, user1, factory, testToken;

	before(async () => {
		let deployment = await deploy();

		controller = deployment.controller;
		factory = deployment.factory;
		testToken = deployment.testToken;

		tokenMinted = await testToken.balanceOf(controller.address);
		user1 = uuid();
		await controller.newWallet(user1);
	});

	it("Should verify Controller contract has token balance", async () => {
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
		await controller.newWallet(user2);

		let user3 = uuid();
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
