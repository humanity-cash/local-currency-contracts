const UBIController = artifacts.require("UBIController");
const Factory = artifacts.require("UBIBeneficiaryFactory");
const UBIBeneficiary = artifacts.require("UBIBeneficiary");
const UBIReconciliationAccount = artifacts.require("UBIReconciliationAccount");
const ERC20 = artifacts.require("ERC20PresetMinterPauser");
const Web3 = require("web3");
const truffleAssert = require("truffle-assertions");
const config = require("./config.json");
const { uuid } = require("uuidv4");

contract("Authorization", async (accounts) => {
	let controller,
		factory,
		cUSDTestToken,
		cUBIAuthToken,
		userId,
		txId1,
		authAmt;

	before(async () => {
		cUSDTestToken = await ERC20.new("cUSD", "cUSD");
		cUBIAuthToken = await ERC20.new(
			"Celo UBI Authorization Token",
			"cUBIAUTH"
		);

		ubiLogic = await UBIBeneficiary.deployed();
		reconcileLogic = await UBIReconciliationAccount.deployed();

		factory = await Factory.new(
			ubiLogic.address,
			reconcileLogic.address,
			cUSDTestToken.address,
			cUBIAuthToken.address
		);

		controller = await UBIController.new(
			cUSDTestToken.address,
			cUBIAuthToken.address,
			factory.address,
			config.custodianAccount
		);

		await factory.transferOwnership(controller.address);

		await cUBIAuthToken.grantRole(
			Web3.utils.keccak256("DEFAULT_ADMIN_ROLE"),
			controller.address
		);
		await cUBIAuthToken.grantRole(
			Web3.utils.keccak256("MINTER_ROLE"),
			controller.address
		);

		result = await cUSDTestToken.mint(
			controller.address,
			Web3.utils.toWei("10000000", "ether")
		);

		userId = uuid();
		await controller.newUbiBeneficiary(userId);
		txId1 = uuid();
		userId = Web3.utils.keccak256(userId);
		authAmt = Web3.utils.toWei("37.89", "ether");
	});

	it("Should authorize a payment for a user", async () => {
		await controller.authorize(userId, txId1, authAmt);
		const authBalance = await controller.authBalanceOfUBIBeneficiary(
			userId
		);
		assert.equal(
			authBalance,
			authAmt,
			`Authorization balance for UBI Beneficiary should be ${authAmt}`
		);
	});

	it("Should de-authorize a payment for a user", async () => {
		await controller.deauthorize(userId, txId1);
		const authBalance = await controller.authBalanceOfUBIBeneficiary(
			userId
		);
		assert.equal(
			authBalance,
			0,
			`Authorization balance for UBI Beneficiary should be zero`
		);
	});

	it("Should not de-authorize a transaction that doesn't exist", async () => {
		await truffleAssert.fails(
			controller.deauthorize(userId, "txId_that_doesn't_exist"),
			truffleAssert.ErrorType.REVERT
		);
	});

	it("Should not authorize a payment for an unknown user", async () => {
		let randomUser = Web3.utils.keccak256(uuid());
		// console.log(`Random user = ${randomUser}`);
		await truffleAssert.fails(
			controller.authorize(randomUser, uuid(), 1),
			truffleAssert.ErrorType.REVERT
		);
	});

	it("Should not authorize a payment for a zero or negative amount", async () => {
		await truffleAssert.fails(
			controller.authorize(userId, uuid(), 0),
			truffleAssert.ErrorType.REVERT
		);
	});

	it("Should not authorize a payment for more than your available balance", async () => {
		tooLargeAuthAmt = Web3.utils.toWei("9999.99", "ether");
		await truffleAssert.fails(
			controller.authorize(userId, uuid(), tooLargeAuthAmt),
			truffleAssert.ErrorType.REVERT
		);
	});

	it("Should count authorizations for a user after authorizing a new payment", async () => {
		await controller.authorize(userId, uuid(), authAmt);
		const address = await controller.beneficiaryAddress(userId);
		// console.log("UBI Beneficiary address = " + address);
		const ubi = new web3.eth.Contract(UBIBeneficiary.abi, address);
		const keys = await ubi.methods.getAuthorizationKeys().call();
		// console.log(keys);
		assert.equal(keys.length, 2, "There should be 2 authorizations");
	});

	it("Should iterate authorizations", async () => {
		const address = await controller.beneficiaryAddress(userId);
		// console.log("UBI Beneficiary address = " + address);
		const ubi = new web3.eth.Contract(UBIBeneficiary.abi, address);
		const keys = await ubi.methods.getAuthorizationKeys().call();

		let auths = [];
		for (let i = 0; i < keys.length; i++) {
			const auth = await ubi.methods
				.getAuthorizationAtKey(keys[i])
				.call();
			auths.push(auth);
		}

		// console.log(auths);
		assert.equal(auths.length, 2, "There should be 2 authorizations");
	});
});
