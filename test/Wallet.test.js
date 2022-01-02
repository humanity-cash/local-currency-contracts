/* global it, before */
const { uuid } = require("uuidv4");
const truffleAssert = require("truffle-assertions");
const { CONTROLLER_ROLE } = require("./deploy");
const { toBytes32 } = require("./toBytes32");
const { oneHundredTokens, oneToken } = require("./constants");
const Wallet = artifacts.require("Wallet");
const Token = artifacts.require("Token");

contract("Wallet", async (accounts) => {
	const [, , , , , controller1, controller2, someone] = accounts;

	let token;

	before(async () => {
		token = await Token.new("TestToken", "TT");
	});

	it("Should create a new wallet", async () => {
		const wallet = await Wallet.new();
		await wallet.initialize(token.address, controller1, toBytes32(uuid()));
	});

	it("Should fail to transfer when not called from controller", async () => {
		const wallet = await Wallet.new();
		await wallet.initialize(token.address, controller1, toBytes32(uuid()));

		await token.mint(wallet.address, oneHundredTokens);

		await truffleAssert.reverts(
			wallet.transferTo(someone, oneToken, {
				from: someone,
			}),
			`AccessControl: account ${someone.toLowerCase()} is missing role ${CONTROLLER_ROLE}`
		);
	});

	it("Should transfer to a new wallet", async () => {
		const wallet1 = await Wallet.new();
		await wallet1.initialize(token.address, controller1, toBytes32(uuid()));

		await token.mint(wallet1.address, oneHundredTokens);

		const wallet2 = await Wallet.new();
		await wallet2.initialize(token.address, controller2, toBytes32(uuid()));

		await wallet1.transferTo(wallet2.address, oneToken, {
			from: controller1,
		});
	});
});
