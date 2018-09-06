var Token = artifacts.require("./SimpleToken.sol");
var u = require("./util.js");
var BN = web3.BigNumber;

var ownerBalance = new BN('100e18');
var creatorBalance = new BN('10e18');
var backer1Balance = new BN('2e18');
var backer2Balance = new BN('3e18');
var backer3Balance = new BN('4e18');

contract('SimpleToken', function(accounts) {
    let [owner, creator, backer1, backer2, backer3] = accounts;

    it("Test initialization", async function() {

        let addrs = [owner, creator, backer1, backer2, backer3];
        let amounts = [ownerBalance, creatorBalance, backer1Balance, backer2Balance, backer3Balance];
        let token = await Token.deployed();

        // Shouldn't be able to initialize from backer3
        await u.shouldRevert(token.initialize([backer3], [ownerBalance], {from: backer3}));

        await token.initialize(addrs, amounts);

        await u.assertBalance(token, owner, ownerBalance);
        await u.assertBalance(token, creator, creatorBalance);
        await u.assertBalance(token, backer1, backer1Balance);
        await u.assertBalance(token, backer2, backer2Balance);
        await u.assertBalance(token, backer3, backer3Balance);
    });

    it("Transfer 1 token from backer2 to creator.", async function() {
        var amount = 1e18;
        let token = await Token.deployed();
        creatorBalance = creatorBalance.plus(amount);
        backer2Balance = backer2Balance.minus(amount);

        await token.transfer(creator, amount, {from: backer2});

        await u.assertBalance(token, creator, creatorBalance, "Creator balance not updated after transfer");
        await u.assertBalance(token, backer2, backer2Balance, "Backer2 balance not updated after transfer");
    });

    it("Test approved 2 token transfer from owner to creator with backer1 as intermediary", async function() {
      var amount = 2e18;
      let token = await Token.deployed();
      ownerBalance = ownerBalance.minus(amount);
      creatorBalance = creatorBalance.plus(amount);

      await token.approve(backer1, amount, {from: owner});
      let allowance = await token.allowance.call(owner, backer1);
      assert.equal(allowance.valueOf(), amount, "Allowance not updated by call to approve");

      await token.transferFrom(owner, creator, amount, {from: backer1});
      
      await u.assertBalance(token, owner, ownerBalance, "owner balance not updated after transfer");
      await u.assertBalance(token, creator, creatorBalance, "Investor balance not updated after transfer");
    });

    it("Should not be able to re-initialize token", async function() {
      let token = await Token.deployed();
      await u.shouldRevert(token.initialize([owner], [ownerBalance], {from: owner}));

      // Definitely shouldn't be able to initialize from backer3
      await u.shouldRevert(token.initialize([backer3], [ownerBalance], {from: backer3}));
    });
});
