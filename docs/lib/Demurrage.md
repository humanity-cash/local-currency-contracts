## `Demurrage`






### `getVersionNumber() → uint256, uint256, uint256, uint256` (external)

Returns the storage, major, minor, and patch version of the contract.




### `compoundDemurrage(uint256 _principle, uint256 _ratioNumerator, uint256 _ratioDenominator, uint256 _compoundingPeriods) → uint256` (public)

/**
Mathematical function to calculate negatively compounding interest (demurrage charge)



This follows a standard compounding formula of FV(future value) = PV (present value) * (1  + ratio ) ^ N
In this function however, the ratio is always intended to be a charge, and thus ( 1 - ratio ) in the brackets
ABDK Math 64.64 Smart Contract Library.  Copyright © 2019 by ABDK Consulting.




