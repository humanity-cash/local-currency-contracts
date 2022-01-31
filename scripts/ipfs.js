#!/usr/bin/env node

const ipfsClient = require('ipfs-http-client');
const shell = require('shelljs');
const path = require('path');
const log = console.log;

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(){
  const ipfs = ipfsClient({
    host:'ipfs.infura.io',
    port: '5001',
    protocol: 'https'
  });

  const artifactPaths = shell.ls('./build/contracts/*.json');

  log("Uploading sources & metadata to IPFS (Infura Gateway)...")
  log("========================================================")

  for (let _path of artifactPaths){
    const artifact = require(path.join(process.cwd(), _path));

    log();
    log(artifact.contractName);
    log("-".repeat(artifact.contractName.length));

    const res = await ipfs.add(artifact.metadata);
      log(`metadata: ${res.path}`);

    const res2 = await ipfs.add(artifact.source);
      log(`source:   ${res2.path}`);

    log(`Waiting 10 seconds before sending next file...`);
    await sleep(10000);
    
  }

  log();
  log('Finished.');
  log();
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.log(err);
    process.exit(1)
  });