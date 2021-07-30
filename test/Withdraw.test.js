/* global it, before */
const truffleAssert = require("truffle-assertions");
const { uuid } = require("uuidv4");
const { oneToken, zeroTokens } = require("./constants");
const { toBytes32 } = require("./toBytes32");
const { deploy, OPERATOR_ROLE } = require("./deploy");

contract("Controller.Withdraw", async (accounts) => {
	const [owner, operator1, operator2, , , someone] = accounts;

	let deployment;

	before(async () => {
		deployment = await deploy(accounts);
	});

	it("Should be able to withdraw from bank1", async () => {
		const { controller } = deployment;

		let user = toBytes32(uuid());
		await controller.newWallet(user, { from: operator1 });

		// Deposit twice before withdrawing		
		await controller.deposit(user, oneToken, { from: operator1 });
		await controller.deposit(user, oneToken, { from: operator1 });
		const result = await controller.withdraw(user, oneToken, { from: operator1 });
		
		truffleAssert.eventEmitted(result, 'UserWithdrawal', (ev) => {return ((ev._userId == user) && (ev._value == oneToken) && (ev._operator == operator1))});

		assert.equal(
			(await controller.balanceOfWallet(user)).toString(),
			oneToken
		);
	});

	it("Should be able to withdraw from bank2", async () => {
		const { controller } = deployment;

		let user = toBytes32(uuid());
		await controller.newWallet(user, { from: operator1 });

		// Deposit twice before withdrawing
		await controller.deposit(user, oneToken, { from: operator2 });
		await controller.deposit(user, oneToken, { from: operator2 });		
		const result = await controller.withdraw(user, oneToken, { from: operator2 });

		truffleAssert.eventEmitted(result, 'UserWithdrawal', (ev) => {return ((ev._userId == user) && (ev._value == oneToken) && (ev._operator == operator2))});

		assert.equal(
			(await controller.balanceOfWallet(user)).toString(),
			oneToken
		);
	});

	it("Should fail to withdraw from owner", async () => {
		const { controller } = deployment;

		let user = toBytes32(uuid());
		await controller.newWallet(user, { from: operator1 });

		await truffleAssert.reverts(
			controller.withdraw(user, oneToken, {
				from: owner,
			}),
			`AccessControl: account ${owner.toLowerCase()} is missing role ${OPERATOR_ROLE}`
		);
	});

	it("Should fail to withdraw from someone", async () => {
		const { controller } = deployment;

		let user = toBytes32(uuid());
		await controller.newWallet(user, { from: operator1 });

		await truffleAssert.reverts(
			controller.withdraw(user, oneToken, {
				from: someone,
			}),
			`AccessControl: account ${someone.toLowerCase()} is missing role ${OPERATOR_ROLE}`
		);
	});

	it("Should fail to withdraw zero", async () => {
		const { controller } = deployment;

		let newUserId = toBytes32(uuid());
		await controller.newWallet(newUserId, { from: operator1 });

		await truffleAssert.reverts(
			controller.withdraw(newUserId, zeroTokens),
			"ERR_ZERO_VALUE"
		);
	});

	it("Should fail to withdraw from unknown wallet", async () => {
		const { controller } = deployment;

		let user = toBytes32(uuid());

		await truffleAssert.reverts(
			controller.withdraw(user, oneToken),
			"ERR_USER_NOT_EXISTS"
		);
	});

	it("Should fail to withdraw when paused", async () => {
		const { controller } = deployment;

		let newUserId = toBytes32(uuid());
		await controller.newWallet(newUserId, { from: operator1 });
		await controller.pause();

		await truffleAssert.reverts(
			controller.withdraw(newUserId, oneToken, { from: operator1 }),
			"Pausable: paused"
		);
	});
});
