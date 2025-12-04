# 🔐 FHEVM Example Hub

> **The ultimate automated generator for privacy-preserving smart contracts using Zama's FHEVM.**

This repository is a comprehensive **Example Hub** and **Scaffolding Tool** designed to help developers instantly generate production-ready, standalone FHEVM projects. Whether you are learning basic encryption or implementing complex sealed-bid auctions, this hub has a template for you.

---

## 🌟 Features

- **🚀 Instant Scaffolding**: Generate fully configured, standalone Hardhat repositories with one command.
- **📚 Comprehensive Catalog**: Covers everything from basic counters to advanced auction systems and OpenZeppelin integrations.
- **🧠 Educational Focus**: Each example comes with dedicated tests and documentation explaining *concepts*, *pitfalls*, and *best practices*.
- **🛠️ Maintenance Ready**: Includes tools to validate examples and mass-update dependencies across the ecosystem.
- **📄 Auto-Documentation**: Automatically generates GitBook-compatible documentation from the codebase.

---

## 🚀 Quick Start

### 1. Setup

Everything you need is in this single repository. Clone and install:

```bash
git clone https://github.com/your-username/fhevm-example-hub.git
cd fhevm-example-hub
npm install
```

*(Note: Ensure you also have the `fhevm-hardhat-base-template` folder in the parent directory if working in the monorepo structure)*

### 2. Generate Your First Example

Create a standalone project for an **Encrypted Counter**:

```bash
npm run create fhe-counter ./my-first-fhevm-app
```

### 3. Run It!

Navigate to your newly created project directory and run the tests:

```bash
cd my-first-fhevm-app
npm install
npm run test
```

---

## 📖 Command Reference

We provide simple `npm` scripts to manage the hub.

| Command | Description | Usage Example |
|---------|-------------|---------------|
| `npm run create` | **Create Single Example**<br>Generates a standalone repo for a specific example ID. | `npm run create blind-auction ./my-auction` |
| `npm run create:category` | **Create Category Suite**<br>Generates a project containing ALL examples in a category. | `npm run create:category basic ./all-basic-examples` |
| `npm run docs` | **Generate Documentation**<br>Builds Markdown docs for all examples in `docs/`. | `npm run docs` |
| `npm run validate` | **Lint Catalog**<br>Checks `example-catalog.json` for missing files or metadata. | `npm run validate` |
| `npm run validate:all` | **Full Product Test**<br>Generates, compiles, and tests *every* example (CI simulation). | `npm run validate:all` |
| `npm run update:deps` | **Update Dependencies**<br>Helper to bump FHEVM versions in the base template. | `npm run update:deps` |

---

## 📦 Example Catalog

You can generate any of the following examples using their **ID**:

### 🟢 Basic & Operations
- `fhe-counter`: Simple encrypted counter (Add/Decrypt)
- `fhe-add`: Homomorphic Addition demonstration
- `fhe-if-then-else`: Conditional logic on encrypted data

### 🔐 Encryption & Decryption
- `encrypt-single-value`: Basic encryption flow
- `encrypt-multiple-values`: Handling arrays/multiple inputs
- `user-decrypt-single-value`: Re-encryption for user access
- `public-decrypt-single-value`: Decrypting to public state

### 🛡️ Concepts & Security
- `access-control`: `FHE.allow` vs `FHE.allowTransient`
- `input-proofs`: preventing ciphertext malling
- `anti-patterns`: Common mistakes to avoid (and why)
- `handles`: Understanding FHE handle lifecycle
- `lab-input-proof`: **Interactive Lab** on input binding concepts

### 🏛️ Applications
- `blind-auction`: Complete sealed-bid auction system
- `confidential-dutch-auction`: Private price dutch auction
- `erc7984-example`: Confidential Token Standard (OpenZeppelin)

---

## 🏗 Architecture

This project is a **Monorepo-style Hub** that consists of:

1.  **`examples/`**: The library of source code for all contracts and tests.
2.  **`fhevm-hardhat-base-template/`**: A clean, minimal Hardhat boilerplate included directly in this repo.
3.  **`scripts/`**: Automation tools that combine the *Base Template* with *Examples* to produce new projects.

When you run `npm run create`, the scripts clone the internal base template and inject the specific example code, giving you a fresh, standalone repository ready for development.

---

## 🤝 Contribution

We welcome contributions! If you want to add a new example or improve existing ones, please read our **[Developer Guide](DEVELOPER_GUIDE.md)**.

1.  Add contract & test in `examples/`
2.  Update `example-catalog.json`
3.  Run `npm run validate`

---

**Built for the Zama Bounty Program Dec 2025**
