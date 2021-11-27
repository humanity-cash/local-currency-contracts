/* global it, before */
const truffleAssert = require("truffle-assertions");
const { uuid } = require("uuidv4");
const { deploy, OPERATOR_ROLE } = require("./deploy");
const { toBytes32 } = require("./toBytes32");
const { oneHundredTokens, oneToken, zeroTokens } = require("./constants");
const utils = require("web3-utils");

contract("Controller.Transfer", async (accounts) => {
	const [owner, operator1, operator2, , , someone] = accounts;

	let deployment, walletId;

	before(async () => {
		deployment = await deploy(accounts);

		const { controller } = deployment;
		walletId = toBytes32(uuid());

		await controller.newWallet(walletId, { from: operator1 });
		await controller.deposit(walletId, oneHundredTokens, {
			from: operator1,
		});
	});

	it("Should transfer 1 token to new wallet (zero round-up)", async () => {
		const { controller } = deployment;
		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId, { from: operator2 });
		const result = await controller.transfer(
			walletId,
			newWalletId,
			oneToken,
			zeroTokens,
			{
				from: operator1,
			}
		);
		truffleAssert.eventEmitted(result, "TransferToEvent", (ev) => {
			return (
				ev._fromUserId == walletId &&
				ev._toUserId == newWalletId &&
				ev._amt == oneToken
			);
		});
	});

	it("Should transfer 1 token to someone (zero round-up)", async () => {
		const { controller } = deployment;
		const result = await controller.methods[
			"transfer(bytes32,address,uint256,uint256)"
		](walletId, someone, oneToken, zeroTokens, {
			from: operator1,
		});
		truffleAssert.eventEmitted(result, "TransferToEvent", (ev) => {
			return (
				ev._fromUserId == walletId &&
				ev._toAddress == someone &&
				ev._amt == oneToken
			);
		});
	});

	it("Should transfer 8.88 token to someone (1.12 token round-up)", async () => {
		const { controller } = deployment;

		const payment = utils.toWei("8.88", "ether");
		const roundUp = utils.toWei("1.12", "ether");

		const result = await controller.methods[
			"transfer(bytes32,address,uint256,uint256)"
		](walletId, someone, payment, roundUp, {
			from: operator1,
		});
		truffleAssert.eventEmitted(result, "TransferToEvent", (ev) => {
			return (
				ev._fromUserId == walletId &&
				ev._toAddress == someone &&
				ev._amt == payment
			);
		});
		truffleAssert.eventEmitted(result, "TransferToEvent", (ev) => {
			return (
				ev._fromUserId == walletId &&
				ev._toUserId == toBytes32("COMMUNITY_CHEST") &&
				ev._amt == roundUp
			);
		});
	});

	it("Should fail to transfer with zero value even if funds are available", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId, { from: operator1 });

		await truffleAssert.reverts(
			controller.transfer(walletId, newWalletId, zeroTokens, zeroTokens, {
				from: operator1,
			}),
			"ERR_ZERO_VALUE"
		);
	});

	it("Should fail to transfer 1 token when called from owner (zero round-up)", async () => {
		const { controller } = deployment;

		await truffleAssert.reverts(
			controller.transfer(walletId, walletId, oneToken, zeroTokens, {
				from: owner,
			}),
			`AccessControl: account ${owner.toLowerCase()} is missing role ${OPERATOR_ROLE}`
		);
	});

	it("Should fail to transfer 1 token when called from someone (zero round-up)", async () => {
		const { controller } = deployment;

		await truffleAssert.reverts(
			controller.transfer(walletId, walletId, oneToken, zeroTokens, {
				from: someone,
			}),
			`AccessControl: account ${someone.toLowerCase()} is missing role ${OPERATOR_ROLE}`
		);
	});

	it("Should fail to transfer 1 token when receiver wallet does not exist (zero round-up)", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid(), { from: operator1 });

		await truffleAssert.reverts(
			controller.transfer(walletId, newWalletId, oneToken, zeroTokens),
			"ERR_USER_NOT_EXIST"
		);
	});

	it("Should fail to transfer 1 token when sender wallet does not exist (zero round-up)", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());

		await truffleAssert.reverts(
			controller.transfer(newWalletId, walletId, oneToken, zeroTokens),
			"ERR_USER_NOT_EXISTS"
		);
	});

	it("Should fail to transfer 1 token when no funds available (zero round-up)", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId, { from: operator1 });

		await truffleAssert.reverts(
			controller.transfer(
				newWalletId,
				newWalletId,
				oneToken,
				zeroTokens,
				{
					from: operator1,
				}
			),
			"ERR_NO_BALANCE"
		);
	});

	it("Should transfer 1 token to new wallet and back (zero round-up)", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId, { from: operator1 });
		await controller.transfer(walletId, newWalletId, oneToken, zeroTokens, {
			from: operator1,
		});
		await controller.transfer(newWalletId, walletId, oneToken, zeroTokens, {
			from: operator1,
		});
	});

	it("Should fail to transfer 1 token to new wallet if paused (zero round-up)", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId, { from: operator1 });
		await controller.pause();
		await truffleAssert.reverts(
			controller.transfer(walletId, newWalletId, oneToken, zeroTokens, {
				from: operator1,
			}),
			"Pausable: paused -- Reason given: Pausable: paused"
		);
	});
});
