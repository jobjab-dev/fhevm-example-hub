import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { PrivateCrowdfunding } from "../../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("PrivateCrowdfunding", function () {
    let contract: PrivateCrowdfunding;
    let contractAddress: string;
    let signers: { deployer: HardhatEthersSigner; creator: HardhatEthersSigner; backer1: HardhatEthersSigner };

    before(async function () {
        const ethSigners = await ethers.getSigners();
        signers = {
            deployer: ethSigners[0],
            creator: ethSigners[1],
            backer1: ethSigners[2],
        };
    });

    beforeEach(async function () {
        if (!fhevm.isMock) {
            this.skip();
        }
        const factory = await ethers.getContractFactory("PrivateCrowdfunding");
        contract = (await factory.deploy()) as PrivateCrowdfunding;
        contractAddress = await contract.getAddress();
    });

    it("should allow creating a campaign and pledging funds", async function () {
        // 1. Create Campaign (Target: 1000, Duration: 1 day)
        const target = 1000;
        const duration = 86400;

        const encTarget = await fhevm.createEncryptedInput(contractAddress, signers.creator.address)
            .add64(target)
            .encrypt();

        await contract.connect(signers.creator).createCampaign(
            encTarget.handles[0],
            encTarget.inputProof,
            duration
        );

        const campaignId = 1;

        // 2. Pledge (Backer1 pledges 500)
        const pledgeAmount = 500;
        const encPledge = await fhevm.createEncryptedInput(contractAddress, signers.backer1.address)
            .add64(pledgeAmount)
            .encrypt();

        await contract.connect(signers.backer1).pledge(
            campaignId,
            encPledge.handles[0],
            encPledge.inputProof
        );

        // 3. Fast forward and finalize
        await ethers.provider.send("evm_increaseTime", [duration + 1]);
        await ethers.provider.send("evm_mine", []);

        await contract.connect(signers.creator).finalizeCampaign(campaignId);

        const c = await contract.campaigns(campaignId);
        expect(c.isFinalized).to.be.true;
    });
});
