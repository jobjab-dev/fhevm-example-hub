import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { ConfidentialVoting } from "../../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ConfidentialVoting", function () {
    let contract: ConfidentialVoting;
    let contractAddress: string;
    let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner; carol: HardhatEthersSigner };

    before(async function () {
        const ethSigners = await ethers.getSigners();
        signers = {
            deployer: ethSigners[0],
            alice: ethSigners[1],
            bob: ethSigners[2],
            carol: ethSigners[3],
        };
    });

    beforeEach(async function () {
        // Check if running on mock environment
        if (!fhevm.isMock) {
            console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
            this.skip();
        }

        const factory = await ethers.getContractFactory("ConfidentialVoting");
        // @ts-ignore
        contract = (await factory.deploy()) as ConfidentialVoting;
        contractAddress = await contract.getAddress();
    });

    it("should create a proposal and accept encrypted votes", async function () {
        // 1. Create Proposal (Duration: 1 hour)
        const duration = 3600;
        const tx = await contract.createProposal("Should we adopt FHE?", duration);
        await tx.wait();

        const proposalId = 1;
        const proposal = await contract.proposals(proposalId);
        expect(proposal.description).to.equal("Should we adopt FHE?");
        expect(proposal.exists).to.be.true;

        // 2. Cast Votes
        // Voter 1 (Alice): YES (true)
        const voteYesAlice = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
            .addBool(true)
            .encrypt();

        await contract.connect(signers.alice).vote(
            proposalId,
            voteYesAlice.handles[0],
            voteYesAlice.inputProof
        );

        // Voter 2 (Bob): NO (false)
        const voteNoBob = await fhevm.createEncryptedInput(contractAddress, signers.bob.address)
            .addBool(false)
            .encrypt();

        await contract.connect(signers.bob).vote(
            proposalId,
            voteNoBob.handles[0],
            voteNoBob.inputProof
        );

        // Voter 3 (Carol): YES (true)
        const voteYesCarol = await fhevm.createEncryptedInput(contractAddress, signers.carol.address)
            .addBool(true)
            .encrypt();

        await contract.connect(signers.carol).vote(
            proposalId,
            voteYesCarol.handles[0],
            voteYesCarol.inputProof
        );

        // 3. Try to reveal before deadline (Should fail)
        await expect(contract.revealResult(proposalId)).to.be.revertedWith("Voting period not ended");

        // 4. Fast forward time
        // Increase time by duration + 1 second
        await ethers.provider.send("evm_increaseTime", [duration + 1]);
        await ethers.provider.send("evm_mine", []);

        // 5. Reveal Result
        // 5. Reveal Result
        const revealTx = await contract.revealResult(proposalId);
        await revealTx.wait();

        const p = await contract.proposals(proposalId);
        const yesResult = await fhevm.publicDecrypt([p.yesCount]);
        const noResult = await fhevm.publicDecrypt([p.noCount]);

        const submitTx = await contract.submitResult(
            proposalId,
            yesResult.abiEncodedClearValues,
            yesResult.decryptionProof,
            noResult.abiEncodedClearValues,
            noResult.decryptionProof
        );
        await submitTx.wait();

        const updatedProposal = await contract.proposals(proposalId);
        expect(updatedProposal.revealed).to.be.true;
        expect(updatedProposal.decryptedYes).to.equal(2); // Alice + Carol
        expect(updatedProposal.decryptedNo).to.equal(1);  // Bob
    });

    it("should prevent double voting", async function () {
        await contract.createProposal("Double Vote Test", 3600);
        const proposalId = 1;

        const vote = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
            .addBool(true)
            .encrypt();

        await contract.connect(signers.alice).vote(proposalId, vote.handles[0], vote.inputProof);

        // Try again 
        await expect(
            contract.connect(signers.alice).vote(proposalId, vote.handles[0], vote.inputProof)
        ).to.be.revertedWith("You have already voted");
    });
});
