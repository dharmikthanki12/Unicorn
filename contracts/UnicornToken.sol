// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UnicornToken (UNC)
 * @dev BEP-20 Token implementation for the UNICORN Web3 Investment & Rewards Protocol.
 * Total Supply: 100,000,000 UNC (100 Million UNC)
 * Standard: BEP-20 (Binance Smart Chain) compatible with ERC-20
 */

interface IBEP20 {
    function totalSupply() external view returns (uint256);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
    function name() external view returns (string memory);
    function getOwner() external view returns (address);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address _owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract UnicornToken is IBEP20 {
    string private constant _name = "Unicorn";
    string private constant _symbol = "UNC";
    uint8 private constant _decimals = 18;
    
    // 100,000,000 UNC with 18 decimals
    uint256 private constant _totalSupply = 100_000_000 * 10**uint256(_decimals);

    address private _owner;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // Protocol Reward Treasury mapping
    mapping(address => bool) public isAuthorizedOperator;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OperatorUpdated(address indexed operator, bool indexed status);
    event StakingRewardDistributed(address indexed recipient, uint256 amount, string reason);

    modifier onlyOwner() {
        require(msg.sender == _owner, "UnicornToken: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == _owner || isAuthorizedOperator[msg.sender], "UnicornToken: caller not authorized");
        _;
    }

    constructor() {
        _owner = msg.sender;
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function name() external pure override returns (string memory) {
        return _name;
    }

    function symbol() external pure override returns (string memory) {
        return _symbol;
    }

    function decimals() external pure override returns (uint8) {
        return _decimals;
    }

    function totalSupply() external pure override returns (uint256) {
        return _totalSupply;
    }

    function getOwner() external view override returns (address) {
        return _owner;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "BEP20: transfer amount exceeds allowance");
        _approve(sender, msg.sender, currentAllowance - amount);
        _transfer(sender, recipient, amount);
        return true;
    }

    function setAuthorizedOperator(address operator, bool status) external onlyOwner {
        require(operator != address(0), "Invalid operator");
        isAuthorizedOperator[operator] = status;
        emit OperatorUpdated(operator, status);
    }

    /**
     * @dev Distribute bonus UNC tokens from the protocol reward vault
     */
    function distributeReward(address recipient, uint256 amount, string calldata reason) external onlyAuthorized returns (bool) {
        require(recipient != address(0), "Cannot send to zero address");
        require(_balances[_owner] >= amount, "Insufficient treasury reserve");
        _transfer(_owner, recipient, amount);
        emit StakingRewardDistributed(recipient, amount, reason);
        return true;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "BEP20: transfer from zero address");
        require(recipient != address(0), "BEP20: transfer to zero address");
        require(_balances[sender] >= amount, "BEP20: transfer amount exceeds balance");

        _balances[sender] -= amount;
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "BEP20: approve from zero address");
        require(spender != address(0), "BEP20: approve to zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
