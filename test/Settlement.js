const UBIController = artifacts.require("UBIController");
const Factory = artifacts.require("UBIBeneficiaryFactory");
const UBIBeneficiary = artifacts.require("UBIBeneficiary");
const UBIReconciliationAccount = artifacts.require("UBIReconciliationAccount");
const ERC20 = artifacts.require("ERC20PresetMinterPauser");
const Web3 = require("web3");
const truffleAssert = require("truffle-assertions");
const config = require("./config.json");
const { uuid } = require("uuidv4");
const TimeTravel = require("./TimeTravel");

contract("Settlement", async (accounts) => {
	let controller, factory, cUSDTestToken, cUBIAuthToken, userId;

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
		userId = Web3.utils.keccak256(userId);
	});

	it("Should settle a payment for a user", async () => {
		const txId1 = uuid();
		const settleAmt = Web3.utils.toWei("11.11", "ether");
		await controller.settle(userId, txId1, settleAmt);
		const balance = await controller.balanceOfUBIBeneficiary(userId);
		const expected = Web3.utils.toWei("88.89", "ether");
		assert.equal(
			balance,
			expected,
			`cUSD Balance of UBI Beneficiary should be ${expected}`
		);
	});

	it("Should have a settled balance in reconciliation account", async () => {
		const expected = Web3.utils.toWei("11.11", "ether");
		const reconciliationAccount = await controller.reconciliationAccount();
		const balance = await cUSDTestToken.balanceOf(reconciliationAccount);
		assert.equal(
			balance,
			expected,
			`Reconciliation account cUSD balance should equal ${expected}`
		);
	});

	it("Should peform new authorize, deauthorize (implicitly) and settle, and have this summed cUSD balance in reconciliation account", async () => {
		const amt = Web3.utils.toWei("22.22", "ether");
		const txId2 = uuid();
		controller.authorize(userId, txId2, amt);
		controller.settle(userId, txId2, amt);
		const reconciliationAccount = await controller.reconciliationAccount();
		const balance = await cUSDTestToken.balanceOf(reconciliationAccount);
		const expected = Web3.utils.toWei("33.33", "ether");
		assert.equal(
			balance,
			expected,
			`Reconciliation account cUSD balance should equal ${expected}`
		);
	});

	it("Should peform reconciliation to custodian account and have reconciled balance", async () => {
		const expected = Web3.utils.toWei("33.33", "ether");
		await controller.reconcile();
		const custodian = config.custodianAccount;
		const balance = await cUSDTestToken.balanceOf(custodian);
		assert.equal(
			balance,
			expected,
			`Custodian cUSD balance after reconciliation should equal ${expected}`
		);
	});

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
		const address = await controller.beneficiaryAddress(userId);
		// console.log("UBI Beneficiary address = " + address);
		const ubi = new web3.eth.Contract(UBIBeneficiary.abi, address);
		const keys = await ubi.methods.getSettlementKeys().call();
		// console.log(keys);
		assert(keys.length == 3);
	});

	it("Should iterate settlements", async () => {
		const address = await controller.beneficiaryAddress(userId);
		// console.log("UBI Beneficiary address = " + address);
		const ubi = new web3.eth.Contract(UBIBeneficiary.abi, address);
		const keys = await ubi.methods.getSettlementKeys().call();

		let settles = [];
		for (let i = 0; i < keys.length; i++) {
			const settle = await ubi.methods.getSettlementAtKey(keys[i]).call();
			settles.push(settle);
		}

		// console.log(settles);
		assert(settles.length == 3);
	});
});
