# Private Crowdfunding

A crowdfunding platform where contribution amounts and campaign targets are kept confidential.

## Overview

This example demonstrates how FHE can be used in DeFi to protect financial privacy. Backers can pledge funds without revealing the exact amount to the public. The campaign creator can check if the total funding meets the goal without necessarily revealing the individual pledges or the exact total until the end (or ever).

## Key FHE Concepts

- **Encrypted Arithmetic (`FHE.add`)**: Aggregates user pledges into a total encrypted balance.
- **Encrypted State**: Both the `targetAmount` and `totalPledged` are stored as `euint64`.
- **Threshold Check (`FHE.ge`)**: Determines if the campaign succeeded (Total >= Target).

## Contract Architecture

### Structs
- `Campaign`: Holds encrypted target, total pledged, deadline, and creator address.

### Functions

- `createCampaign(externalEuint64 _target, ...)`: Initializes a new campaign with a secret goal.
- `pledge(uint256 _id, externalEuint64 _amount, ...)`: Adds an encrypted amount to the campaign.
- `finalizeCampaign(uint256 _id)`: Checks the deadline and compares Total vs Target. Sets the boolean success flag.

## Use Cases

- **Competitive Bidding**: In some fundraising (like constitutionDAO style), revealing exactly how much has been raised allows competitors to outbid. Hidden totals prevent this.
- **Privacy**: Contributors don't expose their net worth or contribution size.

## Extensions

- **Refund Mechanism**: Using `FHE.select`, the contract could allow users to withdraw their funds if `isSuccessful` is false.
- **ERC20 Integration**: Combine with Confidential ERC20 tokens for actual value transfer.
