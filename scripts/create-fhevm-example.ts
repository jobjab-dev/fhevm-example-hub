#!/usr/bin/env node

/**
 * create-fhevm-example - CLI tool to generate standalone FHEVM example repositories
 *
 * Usage: ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]
 *
 * Example: ts-node scripts/create-fhevm-example.ts fhe-counter ./my-fhe-counter
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getProjectRoot() {
  const p1 = path.resolve(__dirname, '..');
  const p2 = path.resolve(__dirname, '../..');
  const p3 = path.resolve(__dirname, '../../..');

  if (fs.existsSync(path.join(p1, 'example-catalog.json'))) return p1;
  if (fs.existsSync(path.join(p2, 'example-catalog.json'))) return p2;
  if (fs.existsSync(path.join(p3, 'example-catalog.json'))) return p3;
  return p1;
}

const PROJECT_ROOT = getProjectRoot();
const CATALOG_PATH = path.join(PROJECT_ROOT, 'example-catalog.json');
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

function copyDirectoryRecursive(source: string, destination: string): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Create subdirectories if they don't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const items = fs.readdirSync(source);

  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      // Skip node_modules, artifacts, cache, etc.
      if (['node_modules', 'artifacts', 'cache', 'coverage', 'types', 'dist'].includes(item)) {
        return;
      }
      copyDirectoryRecursive(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

function getContractName(contractPath: string): string | null {
  const content = fs.readFileSync(contractPath, 'utf-8');
  // Match contract declaration, ignoring comments and ensuring it's followed by 'is' or '{'
  const match = content.match(/^\s*contract\s+(\w+)(?:\s+is\s+|\s*\{)/m);
  return match ? match[1] : null;
}

function updateHardhatConfig(outputDir: string, exampleName: string, contractName: string): void {
  const configPath = path.join(outputDir, 'hardhat.config.ts');
  let configContent = fs.readFileSync(configPath, 'utf-8');

  if (exampleName === 'fhe-counter') {
    // For fhe-counter, we keep the task import but update the filename if needed
    configContent = configContent.replace(/import "\.\/tasks\/FHECounter";/, `import "./tasks/${contractName}";`);
  } else {
    // For other examples, remove the FHECounter task import
    configContent = configContent.replace(/import "\.\/tasks\/FHECounter";[\r\n]*/, '');
  }

  fs.writeFileSync(configPath, configContent);
}

function getConstructorArgs(contractPath: string, contractName: string): string[] {
  const content = fs.readFileSync(contractPath, 'utf-8');
  // Find the specific contract block
  const contractRegex = new RegExp(`contract\\s+${contractName}\\s*(?:is\\s+[^{]+)?\\s*\\{([\\s\\S]*?)\\}`, 'm');
  const match = content.match(contractRegex);

  if (!match) return [];

  const contractBody = match[1];
  // Find constructor within that contract
  const ctorRegex = /constructor\s*\(([^)]*)\)/;
  const ctorMatch = contractBody.match(ctorRegex);

  if (!ctorMatch || !ctorMatch[1].trim()) return [];

  // Return the raw arguments string to be parsed or displayed
  return ctorMatch[1].split(',').map(arg => arg.trim());
}

function updateDeployScript(outputDir: string, contractName: string, contractPath: string): void {
  const deployScriptPath = path.join(outputDir, 'deploy', 'deploy.ts');
  const args = getConstructorArgs(contractPath, contractName);

  let deployArgs = '';
  let deployLog = '';

  if (args.length > 0) {
    deployArgs = `
    // TODO: Constructor arguments required:
    // ${args.join('\n    // ')}
    args: [], // <--- Fill these in!`;

    deployLog = `
  if (!deployed${contractName}.address) {
    console.warn("Deploy failed (or dry run). Check constructor args in deploy/deploy.ts");
  } else {
    console.log(\`${contractName} contract: \`, deployed${contractName}.address);
  }`;
  } else {
    deployLog = `
  console.log(\`${contractName} contract: \`, deployed${contractName}.address);`;
  }

  const deployScript = `import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed${contractName} = await deploy("${contractName}", {
    from: deployer,
    log: true,${deployArgs}
  });${deployLog}
};
export default func;
func.id = "deploy_${contractName.toLowerCase()}";
func.tags = ["${contractName}"];
`;

  fs.writeFileSync(deployScriptPath, deployScript);
}

function updatePackageJson(outputDir: string, exampleName: string, description: string, extraDependencies?: Record<string, string>): void {
  const packageJsonPath = path.join(outputDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = `fhevm-example-${exampleName}`;
  packageJson.description = description;
  packageJson.homepage = `https://github.com/zama-ai/fhevm-examples/${exampleName}`;

  // Add helpful scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "task:account": "hardhat accounts",
    "task:address": "hardhat task:address",
  };

  // Add counter-specific scripts only for fhe-counter
  if (exampleName === 'fhe-counter') {
    packageJson.scripts = {
      ...packageJson.scripts,
      "task:get": "hardhat task:decrypt-count",
      "task:inc": "hardhat task:increment",
      "task:dec": "hardhat task:decrement"
    };
  }

  if (extraDependencies) {
    packageJson.dependencies = { ...packageJson.dependencies, ...extraDependencies };
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function generateReadme(exampleName: string, description: string, contractName: string): string {
  return `# FHEVM Example: ${exampleName}

${description}

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
   # OR use a Private Key
   npx hardhat vars set PRIVATE_KEY

   # [OPTIONAL] Set custom Sepolia RPC URL (Defaults to public node)
   # If you want to use Alchemy, Infura, etc., set it here.
   npx hardhat vars set SEPOLIA_RPC_URL

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   \`\`\`

3. **Compile and test**

   \`\`\`bash
   npm run compile
   npm run test
   \`\`\`

## Contract

The main contract is \`${contractName}\` located in \`contracts/${contractName}.sol\`.

## Testing

Run the test suite:

\`\`\`bash
npm run test
\`\`\`

For Sepolia testnet testing:

\`\`\`bash
npm run test:sepolia
\`\`\`

## Deployment

Deploy to local network:

\`\`\`bash
npx hardhat node
\`\`\`

In a simpler terminal:

\`\`\`bash
npx hardhat deploy --network localhost
\`\`\`

Deploy to Sepolia:

\`\`\`bash
npx hardhat deploy --network sepolia
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
\`\`\`

## Interaction

This project includes Hardhat tasks to interact with the contract.

1. **Start Local Chain** (Terminal 1)
   \`\`\`bash
   npm run chain
   \`\`\`

2. **Deploy Contract** (Terminal 2)
   \`\`\`bash
   npm run deploy:localhost
   \`\`\`
${exampleName === 'fhe-counter' ? `
3. **Interact** (Terminal 2)
   \`\`\`bash
   # Get current count (decrypted)
   npm run task:get -- --network localhost

   # Increment by 5
   npm run task:inc -- --network localhost --value 5

   # Decrement by 2
   npm run task:dec -- --network localhost --value 2
   \`\`\`
` : ''}
## Documentation

- [Project Documentation](./docs/${exampleName}.md)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Examples](https://docs.zama.org/protocol/examples)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

## License

This project is licensed under the BSD-3-Clause-Clear License.

---

**Built with ❤️ using [FHEVM](https://github.com/zama-ai/fhevm) by Zama**
`;
}

export function createExample(exampleName: string, outputDir: string): void {
  const rootDir = path.resolve(__dirname, '..');
  const templateDir = path.join(rootDir, 'fhevm-hardhat-template');

  // Check if example exists
  if (!EXAMPLES_MAP[exampleName]) {
    error(`Unknown example: ${exampleName}\n\nAvailable examples:\n${Object.keys(EXAMPLES_MAP).map(k => `  - ${k}`).join('\n')}`);
  }

  const example = EXAMPLES_MAP[exampleName];
  const contractPath = path.join(rootDir, example.contract);
  const testPath = path.join(rootDir, example.test);

  // Validate paths exist
  if (!fs.existsSync(contractPath)) {
    error(`Contract not found: ${example.contract}`);
  }
  if (!fs.existsSync(testPath)) {
    error(`Test not found: ${example.test}`);
  }

  info(`Creating FHEVM example: ${exampleName}`);
  info(`Output directory: ${outputDir}`);

  // Step 1: Copy template
  log('\n📋 Step 1: Copying template...', Color.Cyan);
  if (fs.existsSync(outputDir)) {
    error(`Output directory already exists: ${outputDir}`);
  }
  copyDirectoryRecursive(templateDir, outputDir);
  success('Template copied');

  // Step 2: Copy contract
  log('\n📄 Step 2: Copying contract...', Color.Cyan);
  const contractName = getContractName(contractPath);
  if (!contractName) {
    error('Could not extract contract name from contract file');
  }

  const contractsDir = path.join(outputDir, 'contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const destContractPath = path.join(outputDir, 'contracts', `${contractName}.sol`);

  // Remove template contract
  const templateContract = path.join(outputDir, 'contracts', 'FHECounter.sol');
  if (fs.existsSync(templateContract)) {
    fs.unlinkSync(templateContract);
  }

  const contractDir = path.dirname(destContractPath);
  if (!fs.existsSync(contractDir)) {
    fs.mkdirSync(contractDir, { recursive: true });
  }

  fs.copyFileSync(contractPath, destContractPath);
  success(`Contract copied: ${contractName}.sol`);

  // Step 3: Copy test
  log('\n🧪 Step 3: Copying test...', Color.Cyan);
  const destTestPath = path.join(outputDir, 'test', path.basename(testPath));

  // Remove template tests
  const testDir = path.join(outputDir, 'test');
  fs.readdirSync(testDir).forEach(file => {
    if (file.endsWith('.ts')) {
      fs.unlinkSync(path.join(testDir, file));
    }
  });

  const testDirName = path.dirname(destTestPath);
  if (!fs.existsSync(testDirName)) {
    fs.mkdirSync(testDirName, { recursive: true });
  }

  fs.copyFileSync(testPath, destTestPath);
  success(`Test copied: ${path.basename(testPath)}`);

  // Copy test fixture if it exists
  if (example.testFixture) {
    const fixtureSourcePath = path.join(rootDir, example.testFixture);
    if (fs.existsSync(fixtureSourcePath)) {
      const destFixturePath = path.join(outputDir, 'test', path.basename(example.testFixture));
      fs.copyFileSync(fixtureSourcePath, destFixturePath);
      success(`Test fixture copied: ${path.basename(example.testFixture)}`);
    }
  }

  // Step 4: Update configuration files
  log('\n⚙️  Step 4: Updating configuration...', Color.Cyan);
  updateDeployScript(outputDir, contractName, destContractPath);
  updatePackageJson(outputDir, exampleName, example.description, example.extraDependencies);
  updateHardhatConfig(outputDir, exampleName, contractName);
  success('Configuration updated');

  // Step 5: Generate README
  log('\n📝 Step 5: Generating README...', Color.Cyan);
  const readme = generateReadme(exampleName, example.description, contractName);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  success('README.md generated');

  // Step 6: Update tasks directory
  log('\n🔧 Step 6: Updating tasks...', Color.Cyan);
  const tasksDir = path.join(outputDir, 'tasks');
  if (fs.existsSync(tasksDir)) {
    const oldTaskFile = path.join(tasksDir, 'FHECounter.ts');

    if (exampleName === 'fhe-counter') {
      // Only keep/update the task file for fhe-counter example
      const newTaskFile = path.join(tasksDir, `${contractName}.ts`);

      if (fs.existsSync(oldTaskFile)) {
        // Read the task file and replace FHECounter with the new contract name
        let taskContent = fs.readFileSync(oldTaskFile, 'utf-8');

        // Replace all occurrences of FHECounter with the new contract name
        taskContent = taskContent.replace(/FHECounter/g, contractName);
        taskContent = taskContent.replace(/fheCounter/g, contractName.charAt(0).toLowerCase() + contractName.slice(1));

        // Write to new file
        fs.writeFileSync(newTaskFile, taskContent);

        // Remove old file if different name
        if (oldTaskFile !== newTaskFile) {
          fs.unlinkSync(oldTaskFile);
        }

        success(`Updated tasks/${contractName}.ts`);
      }
    } else {
      // For other examples, remove the FHECounter task as it's not relevant/compatible
      if (fs.existsSync(oldTaskFile)) {
        fs.unlinkSync(oldTaskFile);
        success('Removed contract-specific tasks (only available for fhe-counter)');
      }
    }

    // Keep accounts.ts as-is (it's generic)
    success('Tasks directory processed');
  }

  // Step 7: Handle documentation
  log('\n📚 Step 7: Setting up documentation...', Color.Cyan);
  const docsDir = path.join(outputDir, 'docs');

  // Create docs directory if it doesn't exist
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }

  // Clear existing docs from template
  fs.readdirSync(docsDir).forEach(file => {
    fs.unlinkSync(path.join(docsDir, file));
  });

  // Try to find specific documentation
  const sourceDocPath = path.join(rootDir, 'docs', 'examples', example.category, `${exampleName}.md`);
  if (fs.existsSync(sourceDocPath)) {
    fs.copyFileSync(sourceDocPath, path.join(docsDir, `${exampleName}.md`));
    success(`Documentation copied: ${exampleName}.md`);
  } else {
    info(`No specific documentation found for ${exampleName}, creating placeholder`);
    const placeholderContent = `# ${exampleName}\n\nDocumentation coming soon.`;
    fs.writeFileSync(path.join(docsDir, `${exampleName}.md`), placeholderContent);
  }

  success('Cleanup complete');

  // Final summary
  log('\n' + '='.repeat(60), Color.Green);
  success(`FHEVM example "${exampleName}" created successfully!`);
  log('='.repeat(60), Color.Green);

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
    log('FHEVM Example Generator', Color.Cyan);
    log('\nUsage: ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]\n');
    log('Available examples:', Color.Yellow);
    Object.entries(EXAMPLES_MAP).forEach(([name, info]) => {
      log(`  ${name}`, Color.Green);
      log(`    ${info.description}`, Color.Reset);
    });
    process.exit(0);
  }

  const exampleName = args[0];
  const outputDir = args[1] || path.join(process.cwd(), 'output', `fhevm-example-${exampleName}`);

  createExample(exampleName, outputDir);
}

if (process.argv[1] === __filename) {
  main();
}

export { EXAMPLES_MAP };
