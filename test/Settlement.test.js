const Wallet = artifacts.require("Wallet");
const Web3 = require("web3");
const truffleAssert = require("truffle-assertions");
const { deploy } = require("./deploy");
const { uuid } = require("uuidv4");

contract("Settlement", async (accounts) => {
	let controller, walletFactory, testToken, userId;

	before(async () => {
		let deployment = await deploy();

		controller = deployment.controller;
		walletFactory = deployment.walletFactory;
		testToken = deployment.testToken

		userId = uuid();
		await controller.newWallet(userId);
		userId = Web3.utils.keccak256(userId);

		await testToken.mint(
			await controller.getWalletAddress(userId),
			Web3.utils.toWei("100", "ether")
		);
	});

	xit("Should settle a payment for a user", async () => {
		const txId1 = uuid();
		const settleAmt = Web3.utils.toWei("11.11", "ether");
		await controller.settle(userId, txId1, settleAmt);
		const balance = await controller.balanceOfWallet(userId);
		const expected = Web3.utils.toWei("88.89", "ether");
		assert.equal(
			balance.toString(),
			expected,
			`token Balance of wallet should be ${expected}`
		);
	});

	// todo add settle twice fail test

	// todo add settle error test for sender that is not controller

	it("Should not settle a payment for 0 amount", async () => {
		const settleAmt = Web3.utils.toWei("0", "ether");
		await truffleAssert.fails(
			controller.settle(userId, uuid(), settleAmt),
			truffleAssert.ErrorType.REVERT
		);
	});

	it("Should not settle a payment for more than your balance amount", async () => {
		const settleAmt = Web3.utils.toWei("99999", "ether");
		await truffleAssert.fails(
			controller.settle(userId, uuid(), settleAmt),
			truffleAssert.ErrorType.REVERT
		);
	});

	it("Should count settlements for a user after settling a new payment", async () => {
		const amt = Web3.utils.toWei("11.11", "ether");
		await controller.settle(userId, uuid(), amt);
		const address = await controller.getWalletAddress(userId);
		const walletContract = new web3.eth.Contract(Wallet.abi, address);
		const keys = await walletContract.methods.getSettlementKeys().call();
		// console.log(keys);
		assert.equal(keys.length, 1);
	});

	it("Should iterate settlements", async () => {
		const address = await controller.getWalletAddress(userId);
		const walletContract = new web3.eth.Contract(Wallet.abi, address);
		const keys = await walletContract.methods.getSettlementKeys().call();

		let settles = [];
		for (let i = 0; i < keys.length; i++) {
			const settle = await walletContract.methods
				.getSettlementAtKey(keys[i])
				.call();
			settles.push(settle);
		}

		// console.log(settles);
		assert.equal(settles.length, 1);
	});
});
