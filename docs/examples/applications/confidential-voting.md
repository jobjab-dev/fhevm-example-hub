# Confidential Voting (Secret Ballot)

This example demonstrates how to implement a **Secret Ballot** voting system where individual votes are encrypted and only the final result is revealed after the deadline.

## 📝 Concept

In a public blockchain voting system, everyone can see who voted for what in real-time. This can lead to **bandwagon effects** or **coercion**.

With **FHEVM**, we can keep votes confidential:
1.  **Encrypted Inputs**: Users submit `ebool` (True/False) encrypted with the contract's public key.
2.  **Confidential Counting**: The contract adds the vote to the `yesCount` or `noCount` without ever decrypting the individual vote.
3.  **Reveal**: After the voting period ends, the contract allows decryption of the final tallies.

## 💻 Code Highlights

### Conditional Logic with `FHE.select`

Since we cannot use `if (encryptedVote)` directly to update different variables (because the branching condition is encrypted), we use **Multiplexing** logic:

```solidity
// Convert boolean vote to integer (1 or 0)
euint64 castYes = FHE.select(_encryptedVote, FHE.asEuint64(1), FHE.asEuint64(0));
euint64 castNo = FHE.select(_encryptedVote, FHE.asEuint64(0), FHE.asEuint64(1));

// Update encrypted counters
p.yesCount = FHE.add(p.yesCount, castYes);
p.noCount = FHE.add(p.noCount, castNo);
```

- If `_encryptedVote` is `true`: `castYes` becomes 1, `castNo` becomes 0.
- If `_encryptedVote` is `false`: `castYes` becomes 0, `castNo` becomes 1.

### Security/Privacy Note

-   **Voter Participation**: In this example, `hasVoted` is public. Observers know *who* voted, but not *what* they voted.
-   **Result Secrecy**: The result is mathematically hidden until `revealResult` calls `FHE.makePubliclyDecryptable`, after which a callback with valid signatures can reveal it via `submitResult`.

