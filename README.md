# Simple Crowdsale

This repository contains a simple (and poorly tested) crowdsale contract written in Solidity, using the latest version of Truffle for testing.

Extend the SimpleProject contract to withhold 50% of tokens from the creator until the vote deadline is reached. After the deadline, the creator may withdraw the remaining tokens if `refundVoteCount` remains less than 50% of `totalPledgeAmount`. Votes are all or nothing and weighted by pledge amount, and may be changed any time between `endTime` and `voteDeadline`.

Notes:

* Minimize extra contract state and methods
* Prefer to minimize code changes
* Keep tests simple (full coverage is not necessary)
* Existing tests should be modified to pass after new functionality is implemented
* Tests marked TODO should be filled in
* No compiler warnings
* Anything in the repo can be modified