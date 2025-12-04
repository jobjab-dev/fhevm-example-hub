import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { AccessControlExample, AccessControlExample__factory } from "../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

async function deployFixture() {
  const factory = (await ethers.getContractFactory("AccessControlExample")) as AccessControlExample__factory;
  const contract = (await factory.deploy()) as AccessControlExample;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("AccessControlExample", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let contract: AccessControlExample;
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

  it("should allow alice to decrypt after being granted access", async function () {
    // 1. Alice sets value to 42
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(42)
      .encrypt();
    
    await contract.connect(signers.alice).setSecureValue(input.handles[0], input.inputProof);

    // 2. Grant access to Alice
    await contract.connect(signers.alice).grantAccessToSender();

    // 3. Decrypt
    const encryptedValue = await contract.getSecureValue();
    const clearValue = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedValue,
        contractAddress,
        signers.alice
    );
    expect(clearValue).to.equal(42);
  });

  it("should not allow bob to decrypt if only alice is allowed", async function () {
    // 1. Alice sets value
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(100)
      .encrypt();
    await contract.connect(signers.alice).setSecureValue(input.handles[0], input.inputProof);

    // 2. Grant access to Alice
    await contract.connect(signers.alice).grantAccess(signers.alice.address);

    // 3. Bob tries to decrypt
    const encryptedValue = await contract.getSecureValue();
    
    // In mock mode, attempting to decrypt without permission usually throws or returns error
    let errorOccurred = false;
    try {
        await fhevm.userDecryptEuint(
            FhevmType.euint32,
            encryptedValue,
            contractAddress,
            signers.bob
        );
    } catch (error) {
        errorOccurred = true;
    }
    expect(errorOccurred).to.be.true;
  });
});

