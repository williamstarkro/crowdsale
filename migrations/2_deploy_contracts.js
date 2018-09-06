
var SimpleToken = artifacts.require("./SimpleToken.sol");
var SimpleProject = artifacts.require("./SimpleProject.sol");
var u = require("../test/util.js");

module.exports = function(deployer, network, accounts) {
    
    deployer.deploy(SimpleToken);
};