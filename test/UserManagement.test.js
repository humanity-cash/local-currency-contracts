/* global it, before */
const Wallet = artifacts.require("Wallet");
const truffleAssert = require("truffle-assertions");
const { uuid } = require("uuidv4");
const { oneToken } = require("./constants");
const { deploy } = require("./deploy");
const { toBytes32 } = require("./toBytes32");

contract("User Management", async () => {
	let deployment, userId;

	before(async () => {
		deployment = await deploy();

		const { controller } = deployment;

		userId = toBytes32(uuid());
		await controller.newWallet(userId);
	});

	it("Should verify Controller contract has token balance", async () => {
		const { token, controller } = deployment;
		await token.mint(controller.address, oneToken);
		const balance = await token.balanceOf(controller.address);
		assert.equal(balance.toString(), oneToken);
	});

	it("Should not create a user that already exists", async () => {
		const { controller } = deployment;

		await truffleAssert.fails(
			controller.newWallet(userId),
			truffleAssert.ErrorType.REVERT
		);
	});

	it("Should create three more users and count a total", async () => {
		const { controller } = deployment;

		let user2 = toBytes32(uuid());
		await controller.newWallet(user2);

		let user3 = toBytes32(uuid());
		await controller.newWallet(user3);

		const walletCount = await controller.getWalletCount();
		assert.equal(walletCount, 3);
	});

	it("Should iterate the users", async () => {
		const { controller } = deployment;

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
