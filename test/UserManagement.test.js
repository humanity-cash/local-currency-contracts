/* global it, before */
const Wallet = artifacts.require("Wallet");
const truffleAssert = require("truffle-assertions");
const { uuid } = require("uuidv4");
const { deploy } = require("./deploy");
const { toBytes32 } = require("./toBytes32");

contract("User Management", async (accounts) => {
	const [, operator1] = accounts;
	let deployment, userId;

	before(async () => {
		deployment = await deploy(accounts);

		const { controller } = deployment;

		userId = toBytes32(uuid());
		await controller.newWallet(userId, { from: operator1 });
	});

	it("Should not create a user that already exists", async () => {
		const { controller } = deployment;

		await truffleAssert.fails(
			controller.newWallet(userId, { from: operator1 }),
			truffleAssert.ErrorType.REVERT
		);
	});

	it("Should create three more users and count a total", async () => {
		const { controller } = deployment;

		let user2 = toBytes32(uuid());
		await controller.newWallet(user2, { from: operator1 });

		let user3 = toBytes32(uuid());
		await controller.newWallet(user3, { from: operator1 });

		const walletCount = await controller.getWalletCount();
		assert.equal(walletCount, 4);
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
		assert.equal(users.length, 4);
	});
});
