import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { RockPaperScissors } from "../../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("RockPaperScissors", function () {
    let contract: RockPaperScissors;
    let contractAddress: string;
    let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };

    before(async function () {
        const ethSigners = await ethers.getSigners();
        signers = {
            deployer: ethSigners[0],
            alice: ethSigners[1],
            bob: ethSigners[2],
        };
    });

    beforeEach(async function () {
        if (!fhevm.isMock) {
            this.skip();
        }
        const factory = await ethers.getContractFactory("RockPaperScissors");
        contract = (await factory.deploy()) as RockPaperScissors;
        contractAddress = await contract.getAddress();
    });

    it("should allow a full game flow (Alice Rock vs Bob Scissors -> Alice Wins)", async function () {
        // 1. Alice creates game with Rock (1)
        const encMoveAlice = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
            .add8(1)
            .encrypt();

        await contract.connect(signers.alice).createGame(
            encMoveAlice.handles[0],
            encMoveAlice.inputProof
        );

        // 2. Bob joins with Scissors (3)
        const encMoveBob = await fhevm.createEncryptedInput(contractAddress, signers.bob.address)
            .add8(3)
            .encrypt();

        await contract.connect(signers.bob).joinGame(
            1, // gameId
            encMoveBob.handles[0],
            encMoveBob.inputProof
        );

        // 3. Reveal
        await contract.connect(signers.alice).revealGame(1);

        const game = await contract.games(1);
        expect(game.isFinished).to.be.true;
    });
});
