const Migrations = artifacts.require("Migrations");
const UBIController = artifacts.require("UBIController");
const UBIBeneficiary = artifacts.require("UBIBeneficiary");
const UBIReconciliationAccount = artifacts.require("UBIReconciliationAccount");
const Factory = artifacts.require("UBIBeneficiaryFactory");
const ERC20 = artifacts.require("ERC20PresetMinterPauser");
const Demurrage = artifacts.require("Demurrage");
const config = require("./config.json");
const utils = require("web3-utils");

module.exports = (deployer, network, accounts) => {
	
	deployer.deploy(Migrations).then((instance) => {
		console.log(`Migrations address ${instance.address}`);
	});	
		
	// Use configation items
	let configToUse = config[`${network}`];
	if(!configToUse)
		configToUse = config["development"];

	let factory, controller, ubiLogic, reconciliationLogic, cUBIAuthToken, cUSDFake;

	// Deploy the Demurrage library first
	deployer.deploy(Demurrage).then(async (instance) => {
	
		// Link implementation contracts for proxied instances to library
		await deployer.link(Demurrage, [UBIBeneficiary, UBIReconciliationAccount]);

		// Deploy logic/implementation contracts
		ubiLogic = await deployer.deploy(UBIBeneficiary);
		reconciliationLogic = await deployer.deploy(UBIReconciliationAccount);

		// Deploy new ERC20 for auth token
		cUBIAuthToken = await deployer.deploy(ERC20, "Celo UBI Authorization Token", "cUBIAUTH");

		// If we are local, create a fake cUSD (there wont be one deployed here)
		let cUSDToUse = configToUse.cUSDToken;
		if(network === "local"){
			cUSDFake = await deployer.deploy(ERC20, "cUSD", "cUSD");
			cUSDToUse = cUSDFake.address;
		}

		// Deploy factory
		factory = await deployer.deploy(
			Factory, 
			ubiLogic.address, 
			reconciliationLogic.address, 
			cUSDToUse, 
			cUBIAuthToken.address
		);

		// Deploy controller
		controller = await deployer.deploy(
			UBIController, 
			cUSDToUse, 
			cUBIAuthToken.address,
			factory.address, 
			configToUse.custodianAccount
		);

		// Make controller own factory
		await factory.transferOwnership(controller.address);

		// If we are local, mint some fake cUSD to play with for the controller
		if(network === "local"){
			await cUSDFake.mint(controller.address, utils.toWei("10000000", "ether"));
		}

		// Make controller minter/admin of cUBIAuth
		await cUBIAuthToken.grantRole(utils.keccak256("DEFAULT_ADMIN_ROLE"), controller.address);
		await cUBIAuthToken.grantRole(utils.keccak256("MINTER_ROLE"), controller.address);

		// Give ownership of controller to the operational account
		await controller.transferOwnership(configToUse.initialOwner);

	});
	
};