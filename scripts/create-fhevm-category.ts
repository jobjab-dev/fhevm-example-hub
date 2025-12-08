#!/usr/bin/env ts-node

/**
 * create-fhevm-category - CLI tool to generate FHEVM projects with multiple examples from a category
 *
 * Usage: ts-node scripts/create-fhevm-category.ts <category> [output-dir]
 *
 * Example: ts-node scripts/create-fhevm-category.ts basic ./output/fhevm-basic-examples
 */

import * as fs from 'fs';
import * as path from 'path';

// Load catalog to find all examples
const CATALOG_PATH = path.join(__dirname, '..', 'example-catalog.json');
let EXAMPLES_MAP: Record<string, any> = {};

try {
  const catalogContent = fs.readFileSync(CATALOG_PATH, 'utf-8');
  EXAMPLES_MAP = JSON.parse(catalogContent);
} catch (e) {
  console.error('Failed to load example catalog:', e);
  process.exit(1);
}

// Color codes for terminal output
enum Color {
  Reset = '\x1b[0m',
  Green = '\x1b[32m',
  Blue = '\x1b[34m',
  Yellow = '\x1b[33m',
  Red = '\x1b[31m',
  Cyan = '\x1b[36m',
  Magenta = '\x1b[35m',
}

function log(message: string, color: Color = Color.Reset): void {
  console.log(`${color}${message}${Color.Reset}`);
}

function error(message: string): never {
  log(`❌ Error: ${message}`, Color.Red);
  process.exit(1);
}

function success(message: string): void {
  log(`✅ ${message}`, Color.Green);
}

function info(message: string): void {
  log(`ℹ️  ${message}`, Color.Blue);
}

// Category configuration interface
interface CategoryConfig {
  name: string;
  description: string;
  contracts: any[];
  additionalDeps?: Record<string, string>;
}

// Build Categories from Catalog
// We iterate through all examples and group them by 'category' field
const CATEGORIES: Record<string, CategoryConfig> = {};

Object.entries(EXAMPLES_MAP).forEach(([key, config]: [string, any]) => {
  const catKey = config.category;
  if (!CATEGORIES[catKey]) {
    CATEGORIES[catKey] = {
      name: `${catKey.charAt(0).toUpperCase() + catKey.slice(1)} Examples`,
      description: `Collection of ${catKey} examples for FHEVM`,
      contracts: []
    };
  }

  // Add contract item
  CATEGORIES[catKey].contracts.push({
    path: config.contract,
    test: config.test,
    // Fixture support if present in future schema
    // fixture: config.fixture 
  });

  // Special case for openzeppelin deps
  if (catKey === 'openzeppelin') {
    CATEGORIES[catKey].additionalDeps = {
      '@openzeppelin/confidential-contracts': '^0.3.0'
    };
  }
});

function copyDirectoryRecursive(source: string, destination: string, excludeDirs: string[] = []): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const items = fs.readdirSync(source);

  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      if (excludeDirs.includes(item)) {
        return;
      }
      copyDirectoryRecursive(sourcePath, destPath, excludeDirs);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

function getContractName(contractPath: string): string | null {
  const content = fs.readFileSync(contractPath, 'utf-8');
  const match = content.match(/^\s*contract\s+(\w+)(?:\s+is\s+|\s*\{)/m);
  return match ? match[1] : null;
}

function generateDeployScript(contractNames: string[]): string {
  return `import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

${contractNames.map(name => `  // Deploy ${name}
  const deployed${name} = await deploy("${name}", {
    from: deployer,
    log: true,
  });
  console.log(\`${name} contract: \${deployed${name}.address}\`);
`).join('\n')}
};

export default func;
func.id = "deploy_all";
func.tags = ["all", ${contractNames.map(n => `"${n}"`).join(', ')}];
`;
}

function generateReadme(category: string, contractNames: string[]): string {
  const categoryInfo = CATEGORIES[category];

  return `# FHEVM Examples: ${categoryInfo.name}

${categoryInfo.description}

## 📦 Included Examples

This project contains ${contractNames.length} example contract${contractNames.length > 1 ? 's' : ''}:

${contractNames.map((name, i) => `${i + 1}. **${name}**`).join('\n')}

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Package manager

### Installation

1. **Install dependencies**

   \`\`\`bash
   npm install
   \`\`\`

2. **Set up environment variables**

   \`\`\`bash
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   \`\`\`

3. **Compile all contracts**

   \`\`\`bash
   npm run compile
   \`\`\`

4. **Run all tests**

   \`\`\`bash
   npm run test
   \`\`\`

## Contracts

${contractNames.map(name => `### ${name}

Located in \`contracts/${name}.sol\`

Run specific tests:
\`\`\`bash
npx hardhat test test/${name}.ts
\`\`\`
`).join('\n')}

## Deployment

### Local Network

\`\`\`bash
# Start local node
npx hardhat node

# Deploy all contracts
npx hardhat deploy --network localhost
\`\`\`

### Sepolia Testnet

\`\`\`bash
# Deploy all contracts
npx hardhat deploy --network sepolia

# Verify contracts
${contractNames.map(name => `npx hardhat verify --network sepolia <${name.toUpperCase()}_ADDRESS>`).join('\n')}
\`\`\`

## Available Scripts

| Script | Description |
|--------|-------------|
| \`npm run compile\` | Compile all contracts |
| \`npm run test\` | Run all tests |
| \`npm run test:sepolia\` | Run tests on Sepolia |
| \`npm run lint\` | Run all linters |
| \`npm run lint:sol\` | Lint Solidity only |
| \`npm run lint:ts\` | Lint TypeScript only |
| \`npm run prettier:check\` | Check formatting |
| \`npm run prettier:write\` | Auto-format code |
| \`npm run clean\` | Clean build artifacts |
| \`npm run coverage\` | Generate coverage report |

## Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Examples](https://docs.zama.org/protocol/examples)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

## License

This project is licensed under the BSD-3-Clause-Clear License.

---

**Built with ❤️ using [FHEVM](https://github.com/zama-ai/fhevm) by Zama**
`;
}

function createCategoryProject(category: string, outputDir: string): void {
  const rootDir = path.resolve(__dirname, '..');
  const templateDir = path.join(rootDir, 'fhevm-hardhat-base-template');

  // Validate category
  if (!CATEGORIES[category]) {
    error(`Unknown category: ${category}\n\nAvailable categories:\n${Object.keys(CATEGORIES).map(k => `  - ${k}: ${CATEGORIES[k].name}`).join('\n')}`);
  }

  const categoryInfo = CATEGORIES[category];
  info(`Creating FHEVM project: ${categoryInfo.name}`);
  info(`Output directory: ${outputDir}`);

  // Check if output directory exists
  if (fs.existsSync(outputDir)) {
    error(`Output directory already exists: ${outputDir}`);
  }

  // Step 1: Copy template
  log('\n📋 Step 1: Copying template...', Color.Cyan);
  copyDirectoryRecursive(templateDir, outputDir, ['node_modules', 'artifacts', 'cache', 'coverage', 'types', 'dist']);
  success('Template copied');

  // Step 2: Clear template contracts and tests
  log('\n🧹 Step 2: Clearing template files...', Color.Cyan);
  const contractsDir = path.join(outputDir, 'contracts');
  const testsDir = path.join(outputDir, 'test');

  // Remove template contract
  fs.readdirSync(contractsDir).forEach(file => {
    if (file.endsWith('.sol')) {
      fs.unlinkSync(path.join(contractsDir, file));
    }
  });

  // Remove template tests
  fs.readdirSync(testsDir).forEach(file => {
    if (file.endsWith('.ts')) {
      fs.unlinkSync(path.join(testsDir, file));
    }
  });
  success('Template files cleared');

  // Step 3: Copy all contracts and tests from category
  log('\n📄 Step 3: Copying contracts and tests...', Color.Cyan);
  const contractNames: string[] = [];
  const copiedTests = new Set<string>();

  categoryInfo.contracts.forEach(({ path: contractPath, test: testPath }) => {
    // Copy contract
    const fullContractPath = path.join(rootDir, contractPath);
    if (!fs.existsSync(fullContractPath)) {
      log(`Warning: Contract not found: ${contractPath}`, Color.Yellow);
      return;
    }

    const contractName = getContractName(fullContractPath);
    if (contractName) {
      contractNames.push(contractName);
      const destContractPath = path.join(contractsDir, `${contractName}.sol`);
      fs.copyFileSync(fullContractPath, destContractPath);
      log(`  ✓ ${contractName}.sol`, Color.Green);
    }

    // Copy test (avoid duplicates)
    const fullTestPath = path.join(rootDir, testPath);
    if (fs.existsSync(fullTestPath) && !copiedTests.has(testPath)) {
      const testFileName = path.basename(testPath);
      const destTestPath = path.join(testsDir, testFileName);
      fs.copyFileSync(fullTestPath, destTestPath);
      copiedTests.add(testPath);
      log(`  ✓ ${testFileName}`, Color.Green);
    }
  });

  success(`Copied ${contractNames.length} contracts and their tests`);

  // Step 4: Generate deployment script
  log('\n⚙️  Step 4: Generating deployment script...', Color.Cyan);
  const deployScript = generateDeployScript(contractNames);
  const deployPath = path.join(outputDir, 'deploy', 'deploy.ts');
  fs.writeFileSync(deployPath, deployScript);
  success('Deployment script generated');

  // Step 5: Update package.json
  log('\n📦 Step 5: Updating package.json...', Color.Cyan);
  const packageJsonPath = path.join(outputDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = `fhevm-examples-${category}`;
  packageJson.description = categoryInfo.description;
  packageJson.homepage = `https://github.com/zama-ai/fhevm-examples/${category}`;

  // Add additional dependencies if needed
  if (categoryInfo.additionalDeps) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...categoryInfo.additionalDeps,
    };
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  success('package.json updated');

  // Step 6: Generate README
  log('\n📝 Step 6: Generating README...', Color.Cyan);
  const readme = generateReadme(category, contractNames);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  success('README.md generated');

  // Final summary
  log('\n' + '='.repeat(60), Color.Green);
  success(`FHEVM ${categoryInfo.name} project created successfully!`);
  log('='.repeat(60), Color.Green);

  log('\n📊 Project Summary:', Color.Magenta);
  log(`  Category: ${categoryInfo.name}`);
  log(`  Contracts: ${contractNames.length}`);
  log(`  Location: ${path.relative(process.cwd(), outputDir)}`);

  log('\n📦 Next steps:', Color.Yellow);
  log(`  cd ${path.relative(process.cwd(), outputDir)}`);
  log('  npm install');
  log('  npm run compile');
  log('  npm run test');

  log('\n🎉 Happy coding with FHEVM!', Color.Cyan);
}

// Main execution
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    log('FHEVM Category Project Generator', Color.Cyan);
    log('\nUsage: ts-node scripts/create-fhevm-category.ts <category> [output-dir]\n');
    log('Available categories:', Color.Yellow);
    Object.entries(CATEGORIES).forEach(([key, info]) => {
      log(`  ${key}`, Color.Green);
      log(`    ${info.name}`, Color.Cyan);
      log(`    ${info.description}`, Color.Reset);
      log(`    Contracts: ${info.contracts.length}`, Color.Blue);
    });
    process.exit(0);
  }

  const category = args[0];
  const outputDir = args[1] || path.join(process.cwd(), 'output', `fhevm-examples-${category}`);

  createCategoryProject(category, outputDir);
}

main();
