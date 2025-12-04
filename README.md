# 🏗️ FHEVM Example Hub

> **The ultimate collection of FHEVM examples, patterns, and labs.**
> 
> *Generate standalone, production-ready repositories for Zama's fhEVM in seconds.*

[![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](LICENSE)
[![FHEVM](https://img.shields.io/badge/FHEVM-Powered-orange)](https://github.com/zama-ai/fhevm)
[![Zama](https://img.shields.io/badge/Built_for-Zama-yellow)](https://zama.ai)

## 🚀 Overview

The **FHEVM Example Hub** is a comprehensive system designed to help developers learn, build, and deploy confidential smart contracts. It serves as:

1.  **A Generator**: Create specific, standalone example repositories with one command.
2.  **A Learning Resource**: Explore categorized examples from Basic to Advanced.
3.  **A Lab**: Hands-on security labs to understand FHE pitfalls (Input Proofs, Replay Attacks).
4.  **A Reference**: Production-grade patterns for OpenZeppelin integration.

## 🌐 Web Catalog

We provide a beautiful, searchable web catalog for all examples.

**[View the Web Catalog](index.html)** (Open `index.html` in your browser)

## 📦 Quick Start

### 1. Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/your-username/fhevm-example-hub.git
cd fhevm-example-hub
npm install
```

### 2. Generate an Example

Want to learn how to build a **Blind Auction**? Generate a dedicated repo for it:

```bash
# Syntax: npm run create <example-name> <output-directory>
npm run create blind-auction ./my-blind-auction
```

Go to your new repo and run it:

```bash
cd my-blind-auction
npm install
npm test
```

### 3. Explore Categories

We have examples for every stage of your journey:

| Category | Examples | Description |
|----------|----------|-------------|
| **🐣 Basic** | `fhe-counter`, `fhe-add` | Learn encryption, decryption, and basic math. |
| **🔐 Encryption** | `encrypt-single-value` | Understand how to encrypt data on client-side. |
| **🔓 Decryption** | `user-decrypt`, `public-decrypt` | Learn re-encryption and public decryption. |
| **🛡️ Access Control** | `access-control` | Master `FHE.allow` and `FHE.allowTransient`. |
| **🧠 Concepts** | `input-proofs`, `handles` | Deep dive into how FHEVM works under the hood. |
| **🧪 Labs** | `lab-wrong-signer`, `lab-replay` | Interactive security labs to break and fix code. |
| **🏦 OpenZeppelin** | `erc20-wrapper`, `vesting-wallet` | Integrate with standard confidential tokens. |
| **🚀 Applications** | `blind-auction` | Real-world confidential dApps. |

## 🛠️ Developer Tools

This hub comes with a suite of tools to maintain high quality:

- **Docs Generator**: `npm run docs` (Generates GitBook-ready markdown from code)
- **Validator**: `npm run validate:all` (Generates and tests ALL examples to ensure they work)
- **Dependency Updater**: `npm run update:deps` (Keeps all examples up to date with latest FHEVM)

## 📚 Documentation

Detailed documentation for each example is auto-generated in the `docs/` folder.

- [Read the Guide](docs/SUMMARY.md)
- [Integration with GitBook](docs/GITBOOK_INTEGRATION.md)

## 🤝 Contributing

We welcome contributions! Please see [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for how to add new examples to the hub.

---

<p align="center">
  Built with ❤️ by Antigravity for the Zama Community
</p>
