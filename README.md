# 🏗️ FHEVM Example Hub & CLI

> **The ultimate collection of FHEVM examples, patterns, and labs.**
> 
> *Generate standalone, production-ready repositories for Zama's fhEVM in seconds.*

[![npm version](https://img.shields.io/npm/v/jobjab-fhevm-examples.svg)](https://www.npmjs.com/package/jobjab-fhevm-examples)
[![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](LICENSE)
[![FHEVM](https://img.shields.io/badge/FHEVM-Powered-orange)](https://github.com/zama-ai/fhevm)
[![Zama](https://img.shields.io/badge/Built_for-Zama-yellow)](https://zama.ai)

## 🚀 Overview

The **FHEVM Example Hub** serves two main purposes:
1.  **CLI Tool (`fhevm-examples`)**: An interactive tool to generate ready-to-use FHEVM projects instantly.
2.  **Educational Monorepo**: A centralized repository containing categorized examples, security labs, and patterns for developers to study and contribute to.

## 📦 Quick Start

Get started with FHEVM development in seconds!

### Option 1: Use with npx (No installation required)

```bash
npx jobjab-fhevm-examples
```

### Option 2: Install Globally

```bash
npm install -g jobjab-fhevm-examples
```

Then run from anywhere:

### Usage

**Interactive Mode:**

Run without arguments to launch the menu:

```bash
fhevm-examples
```

**Direct Mode:**

Generate a specific example directly:

```bash
# Syntax: fhevm-examples <example-name> [output-dir]
fhevm-examples fhe-counter ./my-project
```

**Using with npx (No install required):**

```bash
npx jobjab-fhevm-examples fhe-counter ./my-project
```

**List of keys:**
- `fhe-counter`, `encrypt-single-value`, `blind-auction`, etc. (See catalog)

### What happens next?

1. The CLI downloads the template
2. Injects the selected example code
3. Configures the project
4. Run `npm install && npm run test` to get started!

**Features:**
- 📂 **Categorized Selection**: browse Basic, Applications, Concepts, Labs, etc.
- ⚡ **Instant Setup**: Dependencies, config, and tasks are auto-wired.
- 🛡️ **Production Template**: Uses the official `fhevm-hardhat-template`.

---

## 🛠️ For Contributors & Source Users

If you want to run the hub locally, modify the CLI, or study the examples directly from this repo.

### 1. clone the repository

```bash
git clone https://github.com/jobjab-dev/fhevm-example-hub.git
cd fhevm-example-hub
```

### 2. Install Dependencies

```bash
npm install
```

> **Note:** This command will automatically install dependencies for both the CLI (root) and the Web Catalog (`app/`).


### 3. Build the CLI

You must build the project to compile the TypeScript code.

```bash
npm run build
```

### 4. Run Locally

You can run the CLI directly from the source code (built version):

```bash
npm start
``` 

### 5. Web Catalog

The project also includes a web-based catalog to browse examples visually.

```bash
npm run dev:web
```

This will start a Vite development server in the `app/` directory.

### 6. Available Scripts

We provide several scripts to help manage the hub:

- **`npm run create <example-name> [dir]`**: Run the generator script directly without the UI menu.
  - Example: `npm run create fhe-counter ./my-test`
- **`npm run create:category`**: Helper to scaffold a new category folder structure.
- **`npm run validate`**: Validate that an example exists and has the correct structure.
- **`npm run validate:all`**: **(Important)** Generates, compiles, and tests **ALL** examples in the catalog. Run this before submitting a PR.
- **`npm run docs`**: Auto-generate documentation files from the source code.
- **`npm run update:deps`**: Update dependencies across all examples.

## 🌟 Available Examples

For detailed documentation, patterns, and concepts, please visit the [**Documentation Summary**](docs/SUMMARY.md).

### 🐣 Basic
| Example | Description |
|---------|-------------|
| `fhe-counter` | A simple FHE counter demonstrating basic encrypted operations. |

### 🔐 Encryption
| Example | Description |
|---------|-------------|
| `encrypt-single-value` | Demonstrates FHE encryption mechanism and common pitfalls. |
| `encrypt-multiple-values` | Shows how to create and handle multiple encrypted values. |

### 🔓 Decryption
| Example | Description |
|---------|-------------|
| `user-decrypt-single` | Demonstrates user decryption (re-encryption) for a single value. |
| `user-decrypt-multiple` | Shows how to decrypt multiple values for a user in one go. |
| `public-decrypt-single` | Demonstrates public decryption mechanism (e.g. for game results). |
| `public-decrypt-multiple` | Shows public decryption of multiple values. |

### 🧮 Operations
| Example | Description |
|---------|-------------|
| `fhe-operations` | Demonstrates basic FHE arithmetic (Add, Sub, Mul). |
| `fhe-if-then-else` | Shows conditional logic (select) on encrypted values. |

### 🧠 Concepts
| Example | Description |
|---------|-------------|
| `access-control` | extensive guide on `FHE.allow` and `FHE.allowTransient`. |
| `input-proofs` | Shows correct usage of input proofs to prevent ciphertext mallability. |
| `anti-patterns` | Highlights common security mistakes and how to fix them. |
| `handles` | Deep dive into FHE handles lifecycle and manipulation. |

### 🧪 Security Labs
| Example | Description |
|---------|-------------|
| `lab-input-proof` | Lab: Learn why input proofs must be bound to specific contracts. |
| `lab-wrong-signer` | Lab: Demonstrates input binding to sender address to prevent spoofing. |
| `lab-replay-attack` | Lab: Handling replay attacks and state protection. |

### 🏦 OpenZeppelin Confidential
| Example | Description |
|---------|-------------|
| `erc7984-example` | Standard implementation of the ERC7984 Confidential Token. |
| `erc20-wrapper` | Wraps a public ERC20 token into a private ERC7984 token. |
| `erc7984-erc20-swap` | Atomic swap between confidential ERC7984 and public ERC20. |
| `erc7984-erc7984-swap` | Atomic swap between two confidential ERC7984 tokens. |
| `vesting-wallet` | Confidential vesting wallet for ERC7984 tokens. |

### 🚀 Applications
| Example | Description |
|---------|-------------|
| `blind-auction` | Sealed-bid auction where bids remain confidential until the end. |
| `confidential-voting` | Secret ballot voting using FHE for encrypted vote tallying. |
| `rock-paper-scissors` | Two-player encrypted Rock Paper Scissors game. |
| `private-age-verification` | Verify age > 18 without revealing specific birth date. |
| `private-crowdfunding` | Confidential fundraising with encrypted targets and contributions. |

## 🤝 Contributing

We welcome contributions!
1.  Fork the repo.
2.  Add your example in `examples/`.
3.  Register it in `example-catalog.json`.
4.  Run `npm run validate:all` to ensure it builds and tests correctly.
5.  Submit a Pull Request.

---

<p align="center">
  Built with ❤️ by Antigravity for the Zama Community
</p>
