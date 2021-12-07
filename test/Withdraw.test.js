/* global it, before */
const truffleAssert = require("truffle-assertions");
const { uuid } = require("uuidv4");
const { oneToken, oneHundredTokens, zeroTokens } = require("./constants");
const { toBytes32 } = require("./toBytes32");
const { deploy, OPERATOR_ROLE } = require("./deploy");
const utils = require("web3-utils");

contract("Controller.Withdraw", async (accounts) => {
	const [owner, operator1, operator2, , , someone] = accounts;

	let deployment;

	before(async () => {
		deployment = await deploy(accounts);
	});

	it("Should be able to withdraw $100 from bank1 (with $1.5 redemption fee) ", async () => {
		const { controller } = deployment;

		let user = toBytes32(uuid());
		await controller.newWallet(user, { from: operator1 });

		const humanityCashAddress = await controller.humanityCashAddress();
		const humanityCashUser = toBytes32("HUMANITY_CASH");

		// Deposit twice before withdrawing
		await controller.deposit(user, oneHundredTokens, { from: operator1 });
		await controller.deposit(user, oneHundredTokens, { from: operator1 });
		const result = await controller.withdraw(user, oneHundredTokens, {
			from: operator1,
		});

		// Check withdrawal event
		truffleAssert.eventEmitted(result, "UserWithdrawal", (ev) => {
			return (
				ev._userId == user &&
				ev._value == utils.toWei("100.00") &&
				ev._operator == operator1
			);
		});

		// Check redemption fee event
		truffleAssert.eventEmitted(result, "RedemptionFee", (ev) => {
			return (
				ev._redemptionFeeAddress == humanityCashAddress &&
				ev._redemptionFee >= utils.toWei("1.49") &&
				ev._redemptionFee <= utils.toWei("1.51")
			);
		});

		assert.equal(
			(await controller.balanceOfWallet(user)).toString(),
			oneHundredTokens
		);
		assert(
			(await controller.balanceOfWallet(humanityCashUser)).toString() >=
				utils.toWei("1.49")
		);
		assert(
			(await controller.balanceOfWallet(humanityCashUser)).toString() <=
				utils.toWei("1.51")
		);
	});

	it("Should be able to withdraw $100 from bank2 (with $1.5 redemption fee)", async () => {
		const { controller } = deployment;

		let user = toBytes32(uuid());
		await controller.newWallet(user, { from: operator1 });

		const humanityCashAddress = await controller.humanityCashAddress();
		const humanityCashUser = toBytes32("HUMANITY_CASH");

		// Deposit twice before withdrawing
		await controller.deposit(user, oneHundredTokens, { from: operator1 });
		await controller.deposit(user, oneHundredTokens, { from: operator1 });
		const result = await controller.withdraw(user, oneHundredTokens, {
			from: operator2,
		});

		// Check withdrawal event
		truffleAssert.eventEmitted(result, "UserWithdrawal", (ev) => {
			return (
				ev._userId == user &&
				ev._value == utils.toWei("100.00") &&
				ev._operator == operator2
			);
		});

		// Check redemption fee event
		truffleAssert.eventEmitted(result, "RedemptionFee", (ev) => {
			return (
				ev._redemptionFeeAddress == humanityCashAddress &&
				ev._redemptionFee >= utils.toWei("1.49") &&
				ev._redemptionFee <= utils.toWei("1.51")
			);
		});

		assert.equal(
			(await controller.balanceOfWallet(user)).toString(),
			oneHundredTokens
		);

		// Redemption fees collected in Humanity cash address are now doubled
		assert(
			(await controller.balanceOfWallet(humanityCashUser)).toString() >=
				utils.toWei("2.98")
		);
		assert(
			(await controller.balanceOfWallet(humanityCashUser)).toString() <=
				utils.toWei("3.02")
		);
	});

	it("Should be able to withdraw $0.50 from bank2 (with no redemption fee)", async () => {
		const { controller } = deployment;

		let user = toBytes32(uuid());
		await controller.newWallet(user, { from: operator1 });

		const humanityCashUser = toBytes32("HUMANITY_CASH");

		// Deposit before withdrawing
		await controller.deposit(user, oneHundredTokens, { from: operator1 });
		const result = await controller.withdraw(user, utils.toWei("0.50"), {
			from: operator2,
		});

		// Check withdrawal event
		truffleAssert.eventEmitted(result, "UserWithdrawal", (ev) => {
			return (
				ev._userId == user &&
				ev._value == utils.toWei("0.50") &&
				ev._operator == operator2
			);
		});

		assert.equal(
			(await controller.balanceOfWallet(user)).toString(),
			utils.toWei("99.50")
		);

		// Redemption fees collected in Humanity cash address are now doubled (same as from previous test)
		assert(
			(await controller.balanceOfWallet(humanityCashUser)).toString() >=
				utils.toWei("2.98")
		);
		assert(
			(await controller.balanceOfWallet(humanityCashUser)).toString() <=
				utils.toWei("3.02")
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
