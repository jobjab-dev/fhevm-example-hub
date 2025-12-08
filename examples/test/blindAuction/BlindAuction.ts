import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { BlindAuction, MockGateway } from "../../types";
import { expect } from "chai";

async function deployFixture() {
  const [deployer, alice, bob] = await ethers.getSigners();

  // Deploy Mock Gateway
  const gatewayFactory = await ethers.getContractFactory("MockGateway");
  const gateway = (await gatewayFactory.deploy()) as MockGateway;

  // Deploy Blind Auction with Gateway address
  const factory = await ethers.getContractFactory("BlindAuction");
  const contract = (await factory.deploy(await gateway.getAddress())) as BlindAuction;
  const contractAddress = await contract.getAddress();

  return { contract, gateway, contractAddress, deployer, alice, bob };
}

describe("BlindAuction", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let contract: BlindAuction;
  let gateway: MockGateway;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }
    const fixture = await deployFixture();
    contract = fixture.contract;
    gateway = fixture.gateway;
    contractAddress = fixture.contractAddress;
  });

  it("should determine the winner correctly", async function () {
    // Alice bids 10
    const inputAlice = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(10)
      .encrypt();
    await contract.connect(signers.alice).bid(inputAlice.handles[0], inputAlice.inputProof);

    // Bob bids 20
    const inputBob = await fhevm.createEncryptedInput(contractAddress, signers.bob.address)
      .add32(20)
      .encrypt();
    await contract.connect(signers.bob).bid(inputBob.handles[0], inputBob.inputProof);

    // Stop Auction
    const tx = await contract.stopAuction();
    await tx.wait();

    // Catch RequestDecryption event from Gateway
    // Event: RequestDecryption(handles, selector, callbackTarget)
    const requestEvent = (await gateway.queryFilter(gateway.filters.RequestDecryption()))[0];
    const args = requestEvent.args;
    const reqId = 0; // First request

    // Fulfill request: We know Bob (20) is highest.
    await gateway.fulfillRequest(args.callbackTarget, args.selector, reqId, 20);

    const ended = await contract.ended();
    expect(ended).to.be.true;

    // Claim - Bob
    const claimTxBob = await contract.connect(signers.bob).claim();
    await claimTxBob.wait();

    // Catch Bob's claim decryption request
    const claimRequests = await gateway.queryFilter(gateway.filters.RequestDecryption());
    const claimReqBob = claimRequests[1]; // Second request (Index 1)

    // Bob is winner (1)
    await gateway.fulfillRequest(claimReqBob.args.callbackTarget, claimReqBob.args.selector, 1, 1);
  });

  it("should emit WinnerClaimed event upon fulfillment", async function () {
    // Setup bid 10 (Alice)
    const inputAlice = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(10)
      .encrypt();
    await contract.connect(signers.alice).bid(inputAlice.handles[0], inputAlice.inputProof);

    // Stop
    await contract.stopAuction();

    // Fulfill stop (10)
    const reqs = await gateway.queryFilter(gateway.filters.RequestDecryption());
    await gateway.fulfillRequest(reqs[0].args.callbackTarget, reqs[0].args.selector, 0, 10);

    // Alice claims
    await contract.connect(signers.alice).claim();
    const reqs2 = await gateway.queryFilter(gateway.filters.RequestDecryption());
    const tx = await gateway.fulfillRequest(reqs2[1].args.callbackTarget, reqs2[1].args.selector, 1, 1);

    await expect(tx).to.emit(contract, "WinnerClaimed").withArgs(signers.alice.address, true);
  });

  it("should fail if non-beneficiary stops auction", async function () {
    await expect(contract.connect(signers.bob).stopAuction()).to.be.revertedWith("Not beneficiary");
  });

  it("should fail if bidding after end", async function () {
    await contract.stopAuction();
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add32(10).encrypt();
    await expect(contract.bid(input.handles[0], input.inputProof)).to.be.revertedWith("Auction ended");
  });
});

