var Token = artifacts.require("./SimpleToken.sol");
var Project = artifacts.require("./SimpleProject.sol");
var u = require("./util.js");
var BN = web3.BigNumber;

var ownerBalance = new BN('0');
var backer1Balance = new BN('15e18');
var backer2Balance = new BN('5e18');
var amount = new BN('20e18');

contract('VoteRefundTest', function(accounts) {
    let [owner, creator, backer1, backer2] = accounts;
    let project;

    it("Test project success and 50% creator withdrawal", async function() {
        let addrs = [owner, backer1, backer2];
        let amounts = [ownerBalance, backer1Balance, backer2Balance];
        token = await Token.new();
        await token.initialize(addrs, amounts);
        
        project = await u.createProject(Project, token.address, creator);

        await u.increaseDays(3);

        await token.approve(project.address, backer1Balance, {from: backer1});
        await token.approve(project.address, backer2Balance, {from: backer2});
        await project.acceptBacker({from: backer1});
        await project.acceptBacker({from: backer2});
    
        let pledged = await project.totalPledgeAmount.call();
        assert.equal(amount.toString(16), pledged.toString(16), "Project pledge amount incorrect");

        let projectBalance = await token.balanceOf(project.address);
        assert.equal(amount.toString(16), projectBalance.toString(16), "Project token amount incorrect");

        let backer1Pledge = await project.pledges.call(backer1);
        assert.equal(backer1Balance.toString(16), backer1Pledge.toString(16), "Backer1 pledge amount incorrect");

        let backer2Pledge = await project.pledges.call(backer2);
        assert.equal(backer2Balance.toString(16), backer2Pledge.toString(16), "Backer2 pledge amount incorrect");

        await u.increaseDays(28);

        await u.shouldRevert(project.withdrawFunds(), "Cannot withdraw until sale ends");
        await u.increaseDays(2);

        await project.withdrawFunds({from: creator});
        
        let creatorBalance = await token.balanceOf(creator);
        assert.equal(new BN(20e18/2).toString(16), creatorBalance.toString(16), "Creator token amount incorrect");
    });

    it("Test incomplete amount of refund votes", async function() {

        await project.vote(true, {from: backer2});
 
        // backer should not get any refunds back
        await project.withdrawRefund({from: backer2});
        await u.assertBalance(token, backer2, new BN(0), "Backer did receive refund");
    });

    it("Test vote failure and refund", async function() {
        
        await project.vote(true, {from: backer1});
 
        await u.assertBalance(token, backer1, 0, "Backer already spent tokens");

        // backer will only get half of their funds back
        await project.withdrawRefund({from: backer1});
        await u.assertBalance(token, backer1, backer1Balance/2, "Backer did not receive refund");

        // because voting has surpassed 50% quorom, creator should not get the remaining funds even after voting period ends
        await u.increaseDays(31);
        await u.shouldRevert(project.withdrawFunds({from: creator}), "Creator did not receive funds");
    });

});