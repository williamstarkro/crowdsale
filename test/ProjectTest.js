var Token = artifacts.require("./SimpleToken.sol");
var Project = artifacts.require("./SimpleProject.sol");
var u = require("./util.js");
var BN = web3.BigNumber;

var ownerBalance = new BN('100e18');
var backer1Balance = new BN('2e18');
var backer2Balance = new BN('3e18');
var backer3Balance = new BN('40e18');

contract('ProjectTest', function(accounts) {
    let [owner, creator, backer1, backer2, backer3] = accounts;
    let project, token;

    it("Test initialization", async function() {
        let addrs = [owner, backer1, backer2, backer3];
        let amounts = [ownerBalance, backer1Balance, backer2Balance, backer3Balance];
        token = await Token.new();
        await token.initialize(addrs, amounts);
        
        // Project sanity check
        project = await u.createProject(Project, token.address, creator);
        let projectCreator = await project.creator.call();
        assert.equal(projectCreator.toString(16), creator, "Creator should be second in 'accounts'");
    });

    it("Test project start", async function() {

        // Can't pledge before start
        await token.approve(project.address, new BN(2e18), {from: backer2});
        await u.shouldRevert(project.acceptBacker({from: backer2}));

        await u.increaseDays(3);
    });

    it("Test pledge", async function() {
        let amount = new BN(2e18);

        await u.shouldRevert(project.acceptBacker({from: backer1}));

        await token.approve(project.address, amount, {from: backer1});
        await project.acceptBacker({from: backer1});
    
        let pledged = await project.totalPledgeAmount.call();
        assert.equal(amount.toString(16), pledged.toString(16), "Project pledge amount incorrect");

        let projectBalance = await token.balanceOf(project.address);
        assert.equal(amount.toString(16), projectBalance.toString(16), "Project token amount incorrect");

        let backer1Pledge = await project.pledges.call(backer1);
        assert.equal(amount.toString(16), backer1Pledge.toString(16), "Backer1 pledge amount incorrect");
    });

    it("Successful crowdsale", async function() {
        await u.increaseDays(28);

        await token.approve(project.address, 18e18, {from: backer3});
        await project.acceptBacker({from: backer3});

        let projectBalance = await token.balanceOf(project.address);
        assert.equal(new BN(20e18).toString(16), projectBalance.toString(16), "Project token amount incorrect");

        await u.shouldRevert(project.withdrawFunds(), "Cannot withdraw until sale ends");
        await u.increaseDays(2);
    });

    it("Withdraw funds", async function() {
        
        await project.withdrawFunds({from: creator});
        
        let creatorBalance = await token.balanceOf(creator);
        assert.equal(new BN(20e18/2).toString(16), creatorBalance.toString(16), "Creator token amount incorrect");

        // Simple fix so that the backer could only withdraw half the amount
    });

    it("Successful vote and final withdrawal", async function() {
        // pushes date to be past voting deadline, nobody voted to refund
        // creator should now be able to withdraw and have all the funds
        await u.increaseDays(31);

        await project.withdrawFunds({from: creator});
        
        let creatorBalance = await token.balanceOf(creator);
        assert.equal(new BN(20e18).toString(16), creatorBalance.toString(16), "Creator token amount incorrect");
    });

});