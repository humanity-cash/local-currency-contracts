#!/bin/bash

mythx analyze \
    --mode standard \
    --group-id 61caecc11b183300193e56ff \
    --remap-import "@openzeppelin/=/home/boyd/git/keyko/humanity-cash/local-currency-contracts/node_modules/@openzeppelin/" \
    --solc-version 0.8.4 \
    ./contracts