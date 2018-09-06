var Token = artifacts.require("./SimpleToken.sol");
var Project = artifacts.require("./SimpleProject.sol");
var u = require("./util.js");
var BN = web3.BigNumber;

var backerBalance = new BN('10e18');

contract('FailRefundTest', function(accounts) {
    let [owner, creator, backer] = accounts;
    let project, token;

    it("Test project failure", async function() {
        let addrs = [owner, creator, backer];
        let amounts = [new BN(0), new BN(0), backerBalance];
        token = await Token.new();
        await token.initialize(addrs, amounts);
        
        project = await u.createProject(Project, token.address, creator);
        await u.increaseDays(3);
        await token.approve(project.address, backerBalance, {from: backer});
        await project.acceptBacker({from: backer});
    });

    it("Test invalid refund and withdrawal", async function() {
        await u.shouldRevert(project.withdrawRefund({from: backer}));

        await u.increaseDays(30);
        await u.shouldRevert(project.withdrawFunds({from: creator}))
    });

    it("Test refund", async function() {
        await u.assertBalance(token, backer, 0, "Backer already spent token");

        await project.withdrawRefund({from: backer});
        await u.assertBalance(token, backer, backerBalance, "Backer did not receive refund");
    });

});