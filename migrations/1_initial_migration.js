const Migrations = artifacts.require("Migrations");
const Controller = artifacts.require("Controller");
const Wallet = artifacts.require("Wallet");
const WalletFactory = artifacts.require("WalletFactory");
const Token = artifacts.require("Token");
const ABDKMath64x64 = artifacts.require("ABDKMath64x64");
const config = require("./config.json");
const utils = require("web3-utils");

// erc 20 methods
const MINTER_ROLE = utils.keccak256("MINTER_ROLE");
const PAUSER_ROLE = utils.keccak256("PAUSER_ROLE");

// controller roles
// DEFAULT_ADMIN_ROLE -> 0x special case
const ADMIN_ROLE = utils.keccak256("ADMIN_ROLE");
const OPERATOR_ROLE = utils.keccak256("OPERATOR_ROLE");

// wallet roles
const CONTROLLER_ROLE = utils.keccak256("CONTROLLER_ROLE");

const dumpRoles = async (config, accounts, deployment) => {
	const roles = [
		// token roles
		"MINTER_ROLE",
		"PAUSER_ROLE",

		// controller roles
		"ADMIN_ROLE",
		"OPERATOR_ROLE",

		//wallet roles
		"CONTROLLER_ROLE"
	];
	const [deployer] = accounts;

	console.log("Dumping roles and ownership informations!\n");
	console.log("Deployer:", deployer);
	console.log("Initial Owner:", config.initialOwner);
	console.log("\n");

	for (let entry of deployment) {
		console.log(entry.name, entry.contract.address);
		console.log("===========================");

		// check owner
		if (entry.contract.owner) {
			console.log(entry.name, "Owner:", await entry.contract.owner());
		} else {
			console.log(entry.name, "is not ownable!");
		}

		// check rbac roles
		if (entry.contract.getRoleMemberCount) {
			for (let role of roles) {
				const ROLE = utils.keccak256(role);
				const count = await entry.contract.getRoleMemberCount(ROLE);
				const members = [];

				for (let i = 0; i < count; i++) {
					members.push(await entry.contract.getRoleMember(ROLE, i));
				}

				console.log("Role", entry.name, role, members);
			}

			// DEFAULT_ADMIN_ROLE -> 0x special case
			const defaultAdminRole = "0x";
			const count = await entry.contract.getRoleMemberCount(
				defaultAdminRole
			);
			const members = [];

			for (let i = 0; i < count; i++) {
				members.push(
					await entry.contract.getRoleMember(defaultAdminRole, i)
				);
			}

			console.log("Role", entry.name, "DEFAULT_ADMIN_ROLE", members);
		} else {
			console.log(entry.name, "has no roles specified!");
		}

		console.log("===========================");
		console.log("\n");
	}
};

module.exports = (deployer, network, accounts) => {
	const [deployerAccount, operator1, operator2] = accounts;

	deployer.deploy(Migrations).then((instance) => {
		console.log(`Migrations address ${instance.address}`);
	});	

	// Deploy library and link
	deployer.deploy(ABDKMath64x64).then(async () => {

		// Link implementation contracts for Controller library
		await deployer.link(ABDKMath64x64, Controller);

		// Use configuration items
		let configToUse = config[network];
		if (!configToUse) configToUse = config["development"];

		let walletFactory, controller, token;

		// Deploy logic/implementation contracts
		const wallet = await deployer.deploy(Wallet);

		// do we already have a token to use?
		let tokenToUse = configToUse.token;
		if (!tokenToUse) {
			//no, deploy one
			token = await deployer.deploy(
				Token,
				configToUse.tokenName,
				configToUse.tokenTicker
			);
			tokenToUse = token.address;
		}

		// Deploy factory
		walletFactory = await deployer.deploy(
			WalletFactory,
			tokenToUse,
			wallet.address
		);

		// Deploy controller
		controller = await deployer.deploy(
			Controller,
			tokenToUse,
			walletFactory.address
		);

		// Make controller own factory
		await walletFactory.transferOwnership(controller.address);

		// Mint the launch pool to the HUMANITY_CASH account
		if(token){
			const humanityCashAddress = await controller.humanityCashAddress();
			await token.mint(humanityCashAddress, utils.toWei("60000", "ether"));
		}

		// we just have deployed a token, configure it
		if (token) {
			await token.grantRole(MINTER_ROLE, controller.address);
			await token.renounceRole(MINTER_ROLE, deployerAccount);
		}

		// Grant "operator" role to the operators
		await controller.grantRole(OPERATOR_ROLE, operator1);
		await controller.grantRole(OPERATOR_ROLE, operator2);

		// Grant "operator" to the initialOwner
		await controller.grantRole(OPERATOR_ROLE, configToUse.initialOwner);

		// Give ownership of controller to the operational account
		await controller.transferOwnership(configToUse.initialOwner);

		await dumpRoles(configToUse, accounts, [
			{ name: "Token", contract: token },
			{ name: "Controller", contract: controller },
			{ name: "Wallet", contract: wallet },
			{ name: "WalletFactory", contract: walletFactory },
		]);
	});
};
