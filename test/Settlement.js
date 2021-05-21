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

	it("Should time travel 10 epochs, settle a payment, review demurrage charge (small)", async () => {
		// Create new user for this test
		const demurrageUser = uuid();
		await controller.newUbiBeneficiary(demurrageUser);

		// Update demurrage parameters to 24 blocks in epoch, 1 free epochs, ratio = 1/100 (1%)
		await controller.setDemurrageParameters(24, 1, 1, 100);

		// Get beneficiary
		const bytes32 = Web3.utils.keccak256(demurrageUser);
		const address = await controller.beneficiaryAddress(bytes32);
		const ubi = new web3.eth.Contract(UBIBeneficiary.abi, address);

		// Time travel 10 epochs
		const blocksToAdvance = 24 * 10; // 10 epochs
		await TimeTravel.advanceTimeAndBlockNTimes(blocksToAdvance, 24);

		// Settle $10 for the user
		const txId = uuid();
		const settleAmt = Web3.utils.toWei("10.00", "ether");

		// Show gas estimate for settlement
		const gasEstimate = await controller.settle.estimateGas(
			bytes32,
			txId,
			settleAmt
		);
		console.log(`Gas estimate for .settle() is ${gasEstimate}`);

		// Perform settlement for real
		await controller.settle(bytes32, txId, settleAmt);

		// Review balance of user
		let balance = await controller.balanceOfUBIBeneficiary(bytes32);

		// Balance from this calculation
		// PV = 90*(1-(1/100))^9 ~= 82.21655
		const expectedMin = 82.2;
		const expectedMax = 82.22;
		balance = Web3.utils.fromWei(balance, "ether");
		console.log(`Balance after settling = ${balance}`);

		assert(balance > expectedMin);
		assert(balance < expectedMax);
	}).timeout(100000);

	it("Should time travel 3 epochs, settle a payment, review demurrage charge (zero, within free period)", async () => {
		// Create new user for this test
		const demurrageUser = uuid();
		await controller.newUbiBeneficiary(demurrageUser);

		// Update demurrage parameters to 24 blocks in epoch, 3 free epochs, ratio = 1/100 (1%)
		await controller.setDemurrageParameters(24, 3, 1, 100);

		// Get beneficiary
		const bytes32 = Web3.utils.keccak256(demurrageUser);
		const address = await controller.beneficiaryAddress(bytes32);
		const ubi = new web3.eth.Contract(UBIBeneficiary.abi, address);

		// Time travel 10 epochs
		const blocksToAdvance = 24 * 3; // 3 epochs
		await TimeTravel.advanceTimeAndBlockNTimes(blocksToAdvance, 24);

		// Settle $10 for the user
		const txId = uuid();
		const settleAmt = Web3.utils.toWei("10.00", "ether");

		// Show gas estimate for settlement
		const gasEstimate = await controller.settle.estimateGas(
			bytes32,
			txId,
			settleAmt
		);
		console.log(`Gas estimate for .settle() is ${gasEstimate}`);

		// Perform settlement for real
		await controller.settle(bytes32, txId, settleAmt);

		// Review balance of user
		let balance = await controller.balanceOfUBIBeneficiary(bytes32);

		// Balance from this calculation should be $90 - no demurrage applied
		balance = Web3.utils.fromWei(balance, "ether");
		console.log(`Balance after settling = ${balance}`);
		assert(balance == 90);
	}).timeout(100000);

	it("Should time travel 100 epochs, settle a payment, review demurrage charge (large)", async () => {
		// Create new user for this test
		const demurrageUser = uuid();
		await controller.newUbiBeneficiary(demurrageUser);

		// Update demurrage parameters to 24 blocks in epoch, 28 free epochs, ratio = 1/100 (1%)
		await controller.setDemurrageParameters(24, 28, 1, 100);

		// Get beneficiary and review parameters
		const bytes32 = Web3.utils.keccak256(demurrageUser);
		const address = await controller.beneficiaryAddress(bytes32);
		const ubi = new web3.eth.Contract(UBIBeneficiary.abi, address);

		// Time travel 10 epochs
		let blocksToAdvance = 24 * 100; // 100 epochs
		await TimeTravel.advanceTimeAndBlockNTimes(blocksToAdvance, 24);

		// Settle $10 for the user
		const txId = uuid();
		const settleAmt = Web3.utils.toWei("10.00", "ether");

		// Show gas estimate for settlement
		const gasEstimate = await controller.settle.estimateGas(
			bytes32,
			txId,
			settleAmt
		);
		console.log(`Gas estimate for .settle() is ${gasEstimate}`);

		// Perform settlement for real
		await controller.settle(bytes32, txId, settleAmt);

		// Review balance of user
		let balance = await controller.balanceOfUBIBeneficiary(bytes32);

		// Balance from this calculation
		// PV = 90*(1-(1/100))^9 ~= 43.64922
		const expectedMin = 43.64;
		const expectedMax = 43.65;
		balance = Web3.utils.fromWei(balance, "ether");
		console.log(`Balance after settling = ${balance}`);

		assert(balance > expectedMin);
		assert(balance < expectedMax);

		// Time travel 5 more epochs
		blocksToAdvance = 24 * 5; // 5 epochs
		await TimeTravel.advanceTimeAndBlockNTimes(blocksToAdvance, 24);

		// Settle $20 for the user
		const txId2 = uuid();
		const settleAmt2 = Web3.utils.toWei("20.00", "ether");

		// Perform settlement for real
		await controller.settle(bytes32, txId2, settleAmt2);

		// Review balance of user
		balance = await controller.balanceOfUBIBeneficiary(bytes32);
		balance = Web3.utils.fromWei(balance, "ether");
		console.log(`Balance after settling another $20 (again) = ${balance}`);

		// Don't care about the value, just want to test
		assert(balance);
	}).timeout(2400000);
});
