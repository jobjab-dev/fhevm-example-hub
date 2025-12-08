#!/usr/bin/env ts-node

/**
 * validate-example - Linting tool for FHEVM example catalog
 * 
 * Checks if:
 * 1. Contract file exists
 * 2. Test file exists
 * 3. Required metadata fields are present
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore
import { EXAMPLES_MAP } from './create-fhevm-example.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes
enum Color {
    Reset = '\x1b[0m',
    Green = '\x1b[32m',
    Red = '\x1b[31m',
    Yellow = '\x1b[33m',
    Cyan = '\x1b[36m',
}

function log(message: string, color: Color = Color.Reset): void {
    console.log(`${color}${message}${Color.Reset}`);
}

function validateCatalog() {
    log('🔍 Validating Example Catalog...', Color.Cyan);
    const rootDir = path.resolve(__dirname, '..');

    let errorCount = 0;
    const examples = Object.entries(EXAMPLES_MAP);

    examples.forEach(([key, config]: [string, any]) => {
        log(`\nChecking: ${key}`, Color.Yellow);
        let valid = true;

        // 1. Check Contract Exists
        const contractPath = path.join(rootDir, config.contract);
        if (!fs.existsSync(contractPath)) {
            log(`  ❌ Missing Contract: ${config.contract}`, Color.Red);
            valid = false;
        }

        // 2. Check Test Exists
        const testPath = path.join(rootDir, config.test);
        if (!fs.existsSync(testPath)) {
            log(`  ❌ Missing Test: ${config.test}`, Color.Red);
            valid = false;
        }

        // 3. Check Metadata
        if (!config.category) {
            log(`  ❌ Missing Category`, Color.Red);
            valid = false;
        }
        if (!config.tags || !Array.isArray(config.tags) || config.tags.length === 0) {
            log(`  ❌ Missing Tags`, Color.Red);
            valid = false;
        }

        if (valid) {
            log(`  ✅ OK`, Color.Green);
        } else {
            errorCount++;
        }
    });

    log('\n' + '='.repeat(40));
    if (errorCount > 0) {
        log(`❌ Validation failed with ${errorCount} errors.`, Color.Red);
        process.exit(1);
    } else {
        log(`✅ All ${examples.length} examples passed validation.`, Color.Green);
        process.exit(0);
    }
}

validateCatalog();

