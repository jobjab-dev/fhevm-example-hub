import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { PrivateAgeVerification } from "../../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("PrivateAgeVerification", function () {
    let contract: PrivateAgeVerification;
    let contractAddress: string;
    let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; verifier: HardhatEthersSigner };

    before(async function () {
        const ethSigners = await ethers.getSigners();
        signers = {
            deployer: ethSigners[0],
            alice: ethSigners[1],
            verifier: ethSigners[2],
        };
    });

    beforeEach(async function () {
        if (!fhevm.isMock) {
            this.skip();
        }
        const factory = await ethers.getContractFactory("PrivateAgeVerification");
        contract = (await factory.deploy()) as PrivateAgeVerification;
        contractAddress = await contract.getAddress();
    });

    it("should allow Alice to prove she is over 18", async function () {
        // 1. Register Birth Year (e.g., 2000)
        const birthYear = 2000;
        const currentYear = 2024;
        const minAge = 18;

        const encBirthYear = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
            .add32(birthYear)
            .encrypt();

        await contract.connect(signers.alice).registerBirthYear(
            encBirthYear.handles[0],
            encBirthYear.inputProof
        );

        // 2. Prove to Verifier
        // We expect Alice (24 years old) to be > 18
        const txProve = await contract.connect(signers.alice).proveAgeTo(
            signers.verifier.address,
            currentYear,
            minAge
        );
        await txProve.wait();
    });

    it("should allow registration and proof for under age (logic check)", async function () {
        // Alice born in 2010 (Age 14 in 2024)
        const birthYear = 2010;
        const currentYear = 2024;
        const minAge = 18; // Needs to be born <= 2006

        const encBirthYear = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
            .add32(birthYear)
            .encrypt();

        await contract.connect(signers.alice).registerBirthYear(
            encBirthYear.handles[0],
            encBirthYear.inputProof
        );

        // The contract calculates `isOlder` as FALSE.
        // The function `proveAgeTo` doesn't revert on false.
        await contract.connect(signers.alice).proveAgeTo(
            signers.verifier.address,
            currentYear,
            minAge
        );
    });
});
