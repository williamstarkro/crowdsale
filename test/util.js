
var revertError = "VM Exception while processing transaction: revert";

module.exports = {
    createProject: createProject,
    assertBalance: assertBalance,
    shouldRevert: shouldRevert,
    increaseDays: increaseDays,
    increaseTime: increaseTime,
    ethDays: ethDays,
    addDays: addDays,
    toEthTime: toEthTime,
};

function createProject(Project, token, creator) {
    var goal = 20e18;
    var start = toEthTime(addDays(new Date(), 2));
    var end = toEthTime(addDays(new Date(), 32));
    return Project.new(token, creator, goal, start, end);
}

async function assertBalance(token, addr, targetBalance, msg) {
  var balance = await token.balanceOf.call(addr);
  if(!msg) {
      msg = targetBalance.toExponential()+" should have been in account "+addr.toString(16);
  }
  if(typeof targetBalance == "object") {
      // targetBalance better be a BigNumber!
      targetBalance = targetBalance.toString(10);
  }
  assert.equal(balance.toString(10), targetBalance, msg);
}

async function shouldRevert(action, message) {
  try {
      await action;
  } catch(error) {
      assert.equal(error.message, revertError, message);
      return;
  }
  assert.equal(false, true, message);
}

function increaseDays(days) {
    return increaseTime(ethDays(days));
}

async function increaseTime(time) {
    time = Math.ceil(time);
    await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [time], id: new Date().getSeconds()});
    await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: new Date().getSeconds()});
}

function ethDays(days) {
    var now = new Date();
    var later = addDays(now, days);
    return (toEthTime(later) - toEthTime(now));
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toEthTime(date) {
  return Math.ceil(date.getTime() / 1000);
}