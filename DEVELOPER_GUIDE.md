# Developer Guide

Welcome to the **FHEVM Example Hub**. This guide is for developers who want to contribute new examples, update existing ones, or maintain the infrastructure.

## 🏗 Project Structure

- **`fhevm-example-hub/`**: The main repository containing:
    - `examples/`: Source code for all example contracts and tests.
    - `scripts/`: Automation tools (CLI, generators, validators).
    - `example-catalog.json`: The single source of truth for all examples.
- **`fhevm-hardhat-base-template/`**: The clean Hardhat template used as a skeleton for new projects.

## ➕ Adding a New Example

1. **Create Files**:
   - Add your contract in `examples/contracts/<category>/MyExample.sol`.
   - Add your test in `examples/test/<category>/MyExample.ts`.
   - Ensure you use JSDoc tags in your test file (e.g., `@chapter`, `@summary`) for documentation generation.

2. **Update Catalog**:
   - Open `example-catalog.json`.
   - Add a new entry for your example:
     ```json
     "my-example": {
       "contract": "examples/contracts/category/MyExample.sol",
       "test": "examples/test/category/MyExample.ts",
       "description": "Short description of what this example does",
       "category": "basic",
       "title": "My Example",
       "tags": ["beginner", "concept"]
     }
     ```

3. **Validate**:
   Run the validation script to ensure everything is linked correctly:
   ```bash
   npx ts-node scripts/validate-example.ts
   ```

4. **Test Generation**:
   Try generating your example locally to verify it works:
   ```bash
   npx ts-node scripts/create-fhevm-example.ts my-example ./temp-my-example
   cd temp-my-example
   npm install
   npm run test
   ```

## 🛠 Maintenance Tools

- **Validate All Examples**:
  Runs a comprehensive check by generating, compiling, and testing ALL examples.
  ```bash
  npx ts-node scripts/validate_all.ts
  ```

- **Update Dependencies**:
  Updates the core FHEVM dependencies in the base template (which affects all future generated examples).
  ```bash
  npx ts-node scripts/update-deps.ts
  ```

## 📚 Documentation

Documentation is auto-generated from `example-catalog.json` and code annotations.
To regenerate docs:
```bash
npx ts-node scripts/generate-docs.ts
```

## 🧪 Testing Guidelines

- **Anti-Patterns**: If demonstrating a mistake, ensure the test explicitly expects a revert.
- **Mock Mode**: Ensure tests check `if (!fhevm.isMock)` if they rely on specific testnet behavior, though most should work in mock mode.

