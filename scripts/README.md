# 🛠️ FHEVM Automation Scripts

> **Powering the Example Hub with automation tools for generation, validation, and maintenance.**

This directory contains the TypeScript-based automation scripts that drive the entire FHEVM Example Hub ecosystem.

---

## 📜 Scripts Overview

### 1. `create-fhevm-example.ts`
**🏗️ Single Example Generator**

The core engine that generates a standalone, production-ready FHEVM repository from the base template and example source.

**Usage:**
```bash
npx ts-node scripts/create-fhevm-example.ts <example-id> <output-dir>
```

**What it does:**
- 📋 **Clones** the clean `fhevm-hardhat-base-template`.
- 🚚 **Injects** the specific contract and test files from the Hub.
- ⚙️ **Configures** `deploy.ts` and `package.json` dynamically.
- 📝 **Generates** a tailored `README.md` for the new repo.

---

### 2. `create-fhevm-category.ts`
**📦 Category Suite Generator**

Creates a massive project containing *all* examples from a specific category (e.g., all encryption demos in one repo).

**Usage:**
```bash
npx ts-node scripts/create-fhevm-category.ts <category-name> <output-dir>
```

**Features:**
- 🔗 **Bundles** multiple contracts into one project.
- 🧪 **Aggregates** all relevant tests.
- 🚀 **Unified Deployment** script for all contracts in the suite.

---

### 3. `generate-docs.ts`
**📚 Documentation Generator**

Automatically builds GitBook-compatible Markdown documentation from the project catalog.

**Usage:**
```bash
npx ts-node scripts/generate-docs.ts
```

**Output:**
- 📂 Creates `docs/examples/` with detailed pages for each example.
- 📑 Generates `SUMMARY.md` for seamless GitBook integration.

---

### 4. `validate-example.ts`
**🔍 Catalog Linter**

Ensures the integrity of the Example Hub by checking if the catalog matches the actual codebase.

**Usage:**
```bash
npx ts-node scripts/validate-example.ts
```

**Checks:**
- ✅ Contract file existence.
- ✅ Test file existence.
- ✅ Metadata completeness (tags, description).

---

### 5. `validate_all.ts`
**🛡️ Full Product Validator (CI Simulation)**

The ultimate stress test. It generates, installs, compiles, and tests *every single example* in the catalog.

**Usage:**
```bash
npx ts-node scripts/validate_all.ts
```

> ⚠️ **Note:** This process takes time as it installs dependencies for 10+ generated repositories.

---

### 6. `update-deps.ts`
**🔄 Dependency Updater**

A maintenance utility to help upgrade FHEVM dependencies across the ecosystem by targeting the Base Template.

**Usage:**
```bash
npx ts-node scripts/update-deps.ts
```

---

## 🧩 Configuration

All scripts rely on the **Single Source of Truth**:

📄 **`example-catalog.json`**

This JSON file in the root directory defines all metadata:
```json
{
  "fhe-counter": {
    "contract": "examples/contracts/basic/FHECounter.sol",
    "test": "examples/test/FHECounter.ts",
    "description": "A simple FHE counter...",
    "category": "basic",
    "tags": ["beginner", "counter"]
  }
}
```

---

## 💻 Development Tips

- **TypeScript First**: All scripts are written in TS for type safety. Run them using `ts-node`.
- **Base Template**: The scripts look for `../fhevm-hardhat-base-template` relative to the Hub root. Ensure it exists!
- **Error Handling**: Scripts are designed to fail fast and provide colored output for better debugging.

---

**Happy Automating! 🤖**
