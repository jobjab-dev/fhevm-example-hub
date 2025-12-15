# Private Age Verification

A privacy-preserving identity verification system where users can prove they meet an age requirement without revealing their actual birthdate.

## Overview

In traditional systems, proving your age requires showing an ID that reveals your exact date of birth and other sensitive info. With FHE, users can store their birthdate in an encrypted form and rely on the smart contract to verify "Is User > 18?" (or any age) without ever decrypting the birthdate on-chain.

## Key FHE Concepts

- **Encrypted Comparison (`FHE.ge`)**: Used to check if the user's age is greater than or equal to the minimum requirement.
- **Privacy Preservation**: The birth year remains encrypted (`euint32`) at all times.
- **Selective Disclosure**: The result (True/False) is re-encrypted specifically for the verifier, rather than being broadcast publicly.

## Contract Architecture

- `registerBirthYear(externalEuint32 _encryptedBirthYear, ...)`: Users self-attest their birth year (in a real app, this would be signed by an authority).
- `proveAgeTo(address _verifier, ...)`: Generates an encrypted boolean result (`isOverAge`) and grants the `_verifier` permission to decrypt it.

## Usage Flows

1. **Registration**: User encrypts their birth year (e.g., 2000) and submits it.
2. **Verification Request**: A service (Verifier) asks the user to prove they are 18+.
3. **Proof Submission**: User calls `proveAgeTo(verifierAddress, currentYear, 18)`.
4. **Verification**: The Verifier receives access to the boolean result. They decrypt it to see `true` or `false`.

## Future Improvements

- **Trusted Issuer**: Replace self-registration with a system where a KYC provider "mints" the encrypted birthdate on-chain.
- **Time Oracles**: Use a secure time oracle for `currentYear` to prevent tampering.
