import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { ERC20WrapperExample, MockERC20 } from "../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ERC20WrapperExample", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner };
  let wrapper: ERC20WrapperExample;
  let mockToken: MockERC20;
  let wrapperAddress: string;
  let mockTokenAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1] };
  });

  beforeEach(async function () {
    // Deploy MockERC20
    const mockFactory = await ethers.getContractFactory("MockERC20");
    mockToken = (await mockFactory.deploy()) as MockERC20;
    mockTokenAddress = await mockToken.getAddress();

    // Deploy Wrapper
    const wrapperFactory = await ethers.getContractFactory("ERC20WrapperExample");
    wrapper = (await wrapperFactory.deploy(mockTokenAddress)) as ERC20WrapperExample;
    wrapperAddress = await wrapper.getAddress();
  });

  /**
   * @chapter openzeppelin
   * @example erc20-wrapper
   * @summary Wraps a public ERC20 token into a confidential ERC7984 token.
   */
  it("should wrap public ERC20 to confidential token", async function () {
    const amount = 1000000000000000; // 1000 * 1e12 to ensure it wraps correctly with 18 decimals -> 6 decimals

    // Mint public tokens to Alice
    await mockToken.mint(signers.alice.address, amount);
    expect(await mockToken.balanceOf(signers.alice.address)).to.equal(amount);

    // Alice approves Wrapper
    await mockToken.connect(signers.alice).approve(wrapperAddress, amount);

    // Alice deposits for herself (Public amount in -> Private amount out)
    await wrapper.connect(signers.alice).wrap(signers.alice.address, amount);

    // Check public balance (should be 0)
    expect(await mockToken.balanceOf(signers.alice.address)).to.equal(0);
    // Check wrapper balance (should be amount)
    expect(await mockToken.balanceOf(wrapperAddress)).to.equal(amount);

    // Check confidential balance
    const balanceHandle = await wrapper.confidentialBalanceOf(signers.alice.address);
    const balance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      balanceHandle,
      wrapperAddress,
      signers.alice
    );
    expect(balance).to.equal(amount / 1000000000000);
  });
});

