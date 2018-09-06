pragma solidity 0.4.24;

import "./Ownable.sol";
import "./SimpleToken.sol";
import "./SafeMath.sol";

contract SimpleProject is Ownable {

    /// @notice Emits when a backer pledges to the project
    /// @param backer The address of the backer
    /// @param amount The number of tokens pledged
    event Pledge(address indexed backer, uint256 amount);

    /// @notice Emits when a backer receives a refund
    /// @param backer The address of the refund recipient
    /// @param amount The number of tokens refunded
    event Refund(address indexed backer, uint256 amount);

    /// @notice Emits when a creator withdraws funds
    /// @param creator The address of the project creator
    /// @param amount The number of tokens withdrawn
    /// @param complete True if this is the final withdrawal
    event CreatorWithdraw(address indexed creator, uint256 amount, bool complete);

    /// @notice Emits when a pledger votes to refund or not
    /// @param pledger The address of the project creator
    /// @param amount The value of the vote
    /// @param vote True if they voted to refund
    event PledgerVote(address indexed pledger, uint256 amount, bool vote);

    /// The ERC20 token used to fund the project
    SimpleToken public simpleToken;

    /// The address of the project's creator
    address public creator;

    /// The minimum number of tokens that must be raised
    uint256 public fundingGoal;

    /// Timestamp of the start of the project
    uint256 public startTime;

    /// Timestamp of the end of the project
    uint256 public endTime;

    /// Timestamp of when voting ends
    uint256 public voteDeadline;

    /// Record of pledges that have been made to the project
    mapping(address => uint256) public pledges;

    /// Total number of tokens pledged
    uint256 public totalPledgeAmount;

    /// Record that indicates whether a backer has voted to deny funds to `creator`
    mapping(address => bool) public refundVotes;

    /// Vote count weighted by pledge amount
    uint256 public refundVoteCount;

    // did the creator already withdraw the 50% cap before voting period ends
    bool public preVoteEndWithdraw;

    /// @param _simpleToken Address of ERC20 token used to facilitate the project
    /// @param _creator Address of the project's creator
    /// @param _fundingGoal Minimum number of tokens required for a successful project
    /// @param _startTime Timestamp of sale start
    /// @param _endTime Timestamp of sale end
    constructor(address _simpleToken, address _creator, uint256 _fundingGoal,
                        uint256 _startTime, uint256 _endTime) public {

        require(_startTime > now);
        require(_endTime > _startTime);
        require(_creator != address(0));
        simpleToken = SimpleToken(_simpleToken);
        creator = _creator;
        fundingGoal = _fundingGoal;
        startTime = _startTime;
        endTime = _endTime;
        voteDeadline = endTime + 30 days;
    }

    /// @dev Require that the modified function is only called by `creator`
    modifier onlyCreator() {
        require(msg.sender == creator);
        _;
    }

    /// @dev Require that the modified function occurs between `startTime` and `endTime`
    modifier active() {
        require(now >= startTime && now <= endTime);
        _;
    }

    /// @dev Require that the modified function occurs after `endTime`
    modifier ended() {
        require(now > endTime);
        _;
    }
    
    /// @notice Accept a pledge from a backer that previously approved a token transfer
    function acceptBacker() external active {
        uint256 allowance = simpleToken.allowance(msg.sender, this);
        require(allowance > 0);

        totalPledgeAmount += allowance;

        pledges[msg.sender] = allowance;
        simpleToken.transferFrom(msg.sender, this, allowance);
        emit Pledge(msg.sender, allowance);
    }

    /// @notice Record backer vote
    function vote(bool shouldRefund) external ended {
        require(pledges[msg.sender] > 0);
        require(now < voteDeadline);
        if (refundVotes[msg.sender] == false && shouldRefund == true) {
            refundVotes[msg.sender] = true;
            refundVoteCount += pledges[msg.sender];
            emit PledgerVote(msg.sender, pledges[msg.sender], true);
        } else if (refundVotes[msg.sender] == true && shouldRefund == false) {
            refundVotes[msg.sender] = false;
            refundVoteCount -= pledges[msg.sender];
            emit PledgerVote(msg.sender, pledges[msg.sender], false);
        }
        // TODO
    }

    /// @notice Creator function to withdraw funds after a successful project
    function withdrawFunds() external ended onlyCreator {
        require(totalPledgeAmount >= fundingGoal);
        uint256 amount;
        if (now < voteDeadline) {
            require(!preVoteEndWithdraw);
            amount = simpleToken.balanceOf(this)/2;
            simpleToken.transfer(creator, amount);
            preVoteEndWithdraw = true;
            emit CreatorWithdraw(creator, amount, true);
        } else {
            require(refundVoteCount <= totalPledgeAmount/2);
            amount = simpleToken.balanceOf(this);
            simpleToken.transfer(creator, amount);
            emit CreatorWithdraw(creator, amount, true);
        }
    }

    /// @notice First if: Return tokens to sender if they are a valid backer 
    /// and funding wasn't reached
    /// @notice Second if: Return half tokens to sender if they are a valid backer 
    /// and refundVoteCount > totalPledgeAmount/2
    function withdrawRefund() external ended {
        require(pledges[msg.sender] > 0);
        uint256 refundAmount;
        if (totalPledgeAmount < fundingGoal) {

            refundAmount = pledges[msg.sender];
            pledges[msg.sender] = 0;
            simpleToken.transfer(msg.sender, refundAmount);
        } else if (refundVoteCount > totalPledgeAmount/2) {

            refundAmount = pledges[msg.sender]/2;
            pledges[msg.sender] = 0;
            simpleToken.transfer(msg.sender, refundAmount);
        }

    }
}
