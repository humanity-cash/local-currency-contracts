#!/usr/bin/env node
const shell = require("shelljs");
const path = require("path");
const fs = require("fs");

async function main() {
	const artifactPaths = shell.ls("./build/contracts/*.json");

	for (let _path of artifactPaths) {
		const artifact = require(path.join(process.cwd(), _path));

		if (!fs.existsSync("./artifacts")) {
			fs.mkdirSync("./artifacts");
		}

		if (artifact.abi.length > 0 && artifact.bytecode !== "0x") {
			console.log(artifact.contractName);
			fs.writeFileSync(
				`./artifacts/${artifact.contractName}.bin.json`,
				JSON.stringify(artifact.bytecode)
			);

			fs.writeFileSync(
				`./artifacts/${artifact.contractName}.abi.json`,
				JSON.stringify(artifact.abi, null, 2)
			);
		}
	}

	console.log("\nFinished.\n");
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.log(err);
		process.exit(1);
	});
