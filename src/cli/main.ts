import { intro, outro, select, text, isCancel, cancel, note, spinner } from '@clack/prompts';
// @ts-ignore
import { createExample, EXAMPLES_MAP } from '../../scripts/create-fhevm-example.js';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get package version
function getPackageVersion() {
    try {
        const pkgPath = path.join(__dirname, '../../../package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        return pkg.version;
    } catch {
        return 'unknown';
    }
}

export async function main() {
    console.log();
    intro(chalk.bgCyan(chalk.black(` FHEVM EXAMPLES CLI v${getPackageVersion()} `)));

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
    const examples = Object.entries(EXAMPLES_MAP).map(([key, value]: [string, any]) => ({
        value: key,
        label: value.title || key,
        hint: value.description
    }));

    const exampleName = await select({
        message: 'Select an example template:',
        options: examples,
        maxItems: 10
    });

    if (isCancel(exampleName)) {
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
        createExample(exampleName as string, targetPath);

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
    console.log(chalk.cyan('\nAvailable Examples:\n'));
    Object.entries(EXAMPLES_MAP).forEach(([key, value]: [string, any]) => {
        console.log(`  ${chalk.bold(value.title || key)} (${chalk.yellow(value.category)})`);
        console.log(`  ${chalk.gray(value.description)}`);
        console.log(`  Tags: ${value.tags.join(', ')}`);
        console.log();
    });

    await text({
        message: 'Press Enter to return to menu',
        defaultValue: '',
        placeholder: ''
    });

    return main();
}

async function handleValidate() {
    // We can try to import validation logic or run it via execa if it's a separate script
    // Since we are compiled, we might want to just run the validation script logic
    // But validation logic is in validation-example.ts. We didn't export it nicely.
    // For now, let's just say this feature is for dev environment.

    console.log(chalk.yellow('Validation is currently only supported in development environment via "npm run validate"'));

    await text({
        message: 'Press Enter to return to menu',
        defaultValue: '',
        placeholder: ''
    });

    return main();
}
