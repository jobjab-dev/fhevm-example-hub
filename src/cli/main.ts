import { intro, outro, select, text, isCancel, cancel, note, spinner } from '@clack/prompts';
// @ts-ignore
import { createExample, EXAMPLES_MAP } from '../../scripts/create-fhevm-example.js';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get package version
function getPackageVersion() {
    try {
        // Walk up the directory tree to find package.json
        let dir = __dirname;
        while (dir !== path.dirname(dir)) {
            const pkgPath = path.join(dir, 'package.json');
            if (fs.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                if (pkg.name === 'jobjab-fhevm-examples') {
                    return pkg.version;
                }
            }
            dir = path.dirname(dir);
        }
        return 'unknown';
    } catch {
        return 'unknown';
    }
}

export async function main() {
    console.clear();

    const version = getPackageVersion();

    // FHEVM Theme Gradient - Warm/Yellow tones like the reference image
    const fhevmGradient = gradient(['#ffaa00', '#e0c068', '#ffaa00']);
    const subtitleGradient = gradient(['#888888', '#aaaaaa', '#888888']);

    // Display banner box
    const width = 60;
    const border = '═'.repeat(width);

    // Check for arguments (Non-interactive mode)
    const args = process.argv.slice(2);
    if (args.length > 0) {
        // Handle help flag
        if (args[0] === '--help' || args[0] === '-h') {
            console.log(chalk.cyan(`
FHEVM Example Generator v${version}
`));
            console.log(`Usage: 
  ${chalk.green('fhevm-examples')}                                 (Interactive Mode)
  ${chalk.green('fhevm-examples')} <example-name> [output-dir]     (Direct Mode)
  
Arguments:
  ${chalk.yellow('example-name')}    Name of the example to generate (e.g., fhe-counter)
  ${chalk.yellow('output-dir')}      Optional output directory (default: ./fhevm-example-<name>)
            `);
            process.exit(0);
        }

        // Direct create mode
        const exampleName = args[0];
        const outputDir = args[1] || path.join(process.cwd(), `fhevm-example-${exampleName}`);

        console.log(chalk.gray(`\n  ╔${border}╗`));
        console.log(chalk.gray(`  ║`) + `  FHEVM CLI v${version}`.padEnd(width + 10) + chalk.gray(`   ║`));
        console.log(chalk.gray(`  ╚${border}╝\n`));

        try {
            await createExample(exampleName, outputDir);
            process.exit(0);
        } catch (e: any) {
            console.error(chalk.red(`Error: ${e.message}`));
            process.exit(1);
        }
    }

    console.log(chalk.gray(`\n  ╔${border}╗`));
    console.log(chalk.gray(`  ║`) + `  Welcome to the ${fhevmGradient('FHEVM CLI')} research preview!`.padEnd(width + 10) + chalk.gray(`   ║`)); // Padding adjustment for ANSI codes
    console.log(chalk.gray(`  ╚${border}╝\n`));

    // Render Large ASCII Art
    await new Promise<void>((resolve) => {
        figlet.text('FHEVM HUB', {
            font: 'ANSI Shadow', // Use a block-like shadow font
            horizontalLayout: 'default',
            verticalLayout: 'default',
            width: 80,
            whitespaceBreak: true
        }, function (err: any, data: any) {
            if (err) {
                console.log('Something went wrong...');
                console.dir(err);
                resolve();
                return;
            }
            // Print with gradient
            console.log(fhevmGradient.multiline(data));
            resolve();
        });
    });

    console.log('\n');

    // Subtitle animation
    const subtitle = "  The ultimate collection of FHEVM examples";
    process.stdout.write(chalk.gray('  '));
    for (let i = 0; i < subtitle.length; i++) {
        process.stdout.write(chalk.gray(subtitle[i]));
        await new Promise(r => setTimeout(r, 10)); // Typing effect
    }
    console.log('\n');

    // Replicate the "Login successful" style prompt
    console.log(`  ${chalk.green('✔')} CLI loaded. Press ${chalk.bold.white('Enter')} to continue`);

    // Simple wait for enter to match the "feel"
    await text({
        message: '',
        placeholder: '',
        defaultValue: ''
    });

    // intro(chalk.inverse(' 🔓 Ready to Decrypt & Build ')); // We can skip intro or keep it minimal

    const options = [
        { value: 'create', label: 'Create New Example Project', hint: 'Generate a new FHEVM project from templates' },
        { value: 'list', label: 'List Available Examples', hint: 'View all available templates in the catalog' },
        { value: 'validate', label: 'Validate Catalog', hint: 'For developers trying to add new examples' },
        { value: 'exit', label: 'Exit' }
    ];

    const action = await select({
        message: 'What would you like to do?',
        options
    });

    if (isCancel(action) || action === 'exit') {
        outro('👋 Goodbye!');
        process.exit(0);
    }

    if (action === 'create') {
        await handleCreate();
    } else if (action === 'list') {
        await handleList();
    } else if (action === 'validate') {
        await handleValidate();
    }
}

async function handleCreate() {
    // Group examples by category
    const categories: Record<string, any[]> = {};
    // ... (grouping logic remains)

    Object.entries(EXAMPLES_MAP).forEach(([key, value]: [string, any]) => {
        const cat = value.category || 'Uncategorized';
        if (!categories[cat]) {
            categories[cat] = [];
        }
        categories[cat].push({ key, ...value });
    });

    const categoryDescriptions: Record<string, string> = {
        'basic': 'Fundamental concepts: Encryption, Decryption, Math',
        'applications': 'Real-world decentralized applications',
        'concepts': 'Deep dive into specific FHEVM mechanics',
        'labs': 'Security labs and vulnerability demonstrations',
        'openzeppelin-confidential-contracts': 'Standard ERC tokens with confidentiality',
    };

    // Step 1: Select Category
    const categoryOptions = [
        ...Object.keys(categories).map(cat => ({
            value: cat,
            label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' '),
            hint: categoryDescriptions[cat] || `Examples related to ${cat}`
        })),
        { value: 'back', label: '← Back', hint: 'Return to main menu' } // Back option
    ];

    const selectedCategory = await select({
        message: 'Select a category:',
        options: categoryOptions,
    });

    if (isCancel(selectedCategory) || selectedCategory === 'back') {
        if (selectedCategory === 'back') return main();
        cancel('Operation cancelled.');
        return main();
    }

    // Step 2: Select Example from Category
    const exampleOptions = [
        ...categories[selectedCategory as string].map((ex: any) => ({
            value: ex.key,
            label: ex.title || ex.key,
            hint: ex.description
        })),
        { value: 'back', label: '← Back', hint: 'Return to category selection' } // Back option
    ];

    const exampleName = await select({
        message: `Select an example from ${selectedCategory}:`,
        options: exampleOptions,
        maxItems: 10
    });

    if (isCancel(exampleName) || exampleName === 'back') {
        if (exampleName === 'back') return handleCreate(); // Recursive call to go back to category selection
        cancel('Operation cancelled.');
        return main();
    }

    const defaultDir = `./fhevm-example-${exampleName}`;
    const outputDir = await text({
        message: 'Where should we create the project?',
        placeholder: defaultDir,
        initialValue: defaultDir,
        validate(value) {
            if (value.length === 0) return 'Please specify a directory';
            if (fs.existsSync(value) && fs.readdirSync(value).length > 0) return 'Directory is not empty';
        }
    });

    if (isCancel(outputDir)) {
        cancel('Operation cancelled.');
        return main();
    }

    const s = spinner();
    s.start('Creating project...');

    try {
        // Run the create logic
        // We use process.cwd() as the base for the output path
        const targetPath = path.resolve(process.cwd(), outputDir as string);
        await createExample(exampleName as string, targetPath);

        s.stop('Project created successfully!');

        note(`
To get started:
  cd ${outputDir}
  npm install
  npm run compile
  npm run test
        `, 'Next steps');

        outro(`🚀 Happy coding with FHEVM!`);

    } catch (e: any) {
        s.stop('Failed to create project');
        console.error(chalk.red(e.message));
        process.exit(1);
    }
}

async function handleList() {
    console.log(chalk.cyan.bold('\n📚 Available Examples (Categorized):\n'));

    const categories: Record<string, any[]> = {};
    Object.entries(EXAMPLES_MAP).forEach(([key, value]: [string, any]) => {
        const cat = value.category || 'Uncategorized';
        if (!categories[cat]) {
            categories[cat] = [];
        }
        categories[cat].push({ key, ...value });
    });

    for (const [category, examples] of Object.entries(categories)) {
        console.log(chalk.yellow.bold(`\n📂 ${category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')}`));
        console.log(chalk.gray('  ' + '─'.repeat(50)));

        examples.forEach((example: any) => {
            console.log(`  ${chalk.bold.white(example.title || example.key)}`);
            console.log(`    ${chalk.gray(example.description)}`);
            if (example.tags && example.tags.length > 0) {
                console.log(`    ${chalk.dim('Tags:')} ${chalk.blue(example.tags.join(', '))}`);
            }
            console.log();
        });
    }

    await text({
        message: 'Press Enter to return to menu',
        defaultValue: '',
        placeholder: ''
    });

    return main();
}

async function handleValidate() {
    console.log(chalk.yellow('Validation is currently only supported in development environment via "npm run validate"'));

    await text({
        message: 'Press Enter to return to menu',
        defaultValue: '',
        placeholder: ''
    });

    return main();
}
