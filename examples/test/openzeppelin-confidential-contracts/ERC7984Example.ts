import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { ERC7984Example, ERC7984Example__factory } from "../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

async function deployFixture() {
  const factory = (await ethers.getContractFactory("ERC7984Example")) as ERC7984Example__factory;
  const contract = (await factory.deploy()) as ERC7984Example;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("ERC7984Example", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let contract: ERC7984Example;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }
    ({ contract, contractAddress } = await deployFixture());
  });

  it("should mint and transfer confidential tokens", async function () {
    // Mint 100 to Alice
    await contract.mint(signers.alice.address, 100);

    // Check balance (encrypted)
    const balanceHandle = await contract.confidentialBalanceOf(signers.alice.address);
    // User decrypt
    const balance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      balanceHandle,
      contractAddress,
      signers.alice
    );
    expect(balance).to.equal(100);

    // Transfer 10 from Alice to Bob
    // Alice needs to encrypt the amount
    const inputAmount = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add64(10)
      .encrypt();

    // Using our helper transferExternal
    await contract.connect(signers.alice).transferExternal(signers.bob.address, inputAmount.handles[0], inputAmount.inputProof);

    // Check Bob's balance
    const bobBalanceHandle = await contract.confidentialBalanceOf(signers.bob.address);
    const bobBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      bobBalanceHandle,
      contractAddress,
      signers.bob
    );
    expect(bobBalance).to.equal(10);

    // Check Alice's balance
    const aliceNewBalanceHandle = await contract.confidentialBalanceOf(signers.alice.address);
    const aliceNewBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      aliceNewBalanceHandle,
      contractAddress,
      signers.alice
    );
    expect(aliceNewBalance).to.equal(90);
  });
});

