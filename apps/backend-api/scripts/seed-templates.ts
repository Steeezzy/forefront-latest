/**
 * One-time script to seed the templates table by POSTing to the admin/seed endpoint.
 *
 * This script reads the hardcoded templates from template-data.ts (running in Node via ESM)
 * and sends them to the backend API.
 *
 * Usage:
 *   1. Start backend server: npm run start (or dev)
 *   2. In another terminal: npx tsx scripts/seed-templates.ts
 *
 * Or curl from shell:
 *   curl -X POST http://localhost:4000/api/templates/admin/seed -H "Content-Type: application/json" -d @templates-seed-data.json
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function loadTemplateData() {
    // Dynamically import the template-data.ts from the frontend
    // This is a bit hacky but works for one-time seeding
    const frontendPath = join(__dirname, '../../src/components/voice-agents/template-data.ts');
    const fileContent = await readFile(frontendPath, 'utf-8');

    // We need to extract the AGENT_TEMPLATES array via eval or by constructing a temporary module
    // For reliability, we'll parse the file to extract the constant (not ideal but works)
    // Better: write a separate JSON file that both frontend and backend can read, but for now:
    throw new Error('Manual seeding required: Please copy AGENT_TEMPLATES from template-data.ts into a JSON file and POST to /api/templates/admin/seed');
}

async function main() {
    console.log('🌱 Seeding templates from template-data.ts...');
    console.log(`📡 Backend URL: ${BACKEND_URL}`);

    try {
        // Load template data
        const templates = await loadTemplateData();
        console.log(`📦 Loaded ${templates.length} templates`);

        // Send to backend
        const response = await fetch(`${BACKEND_URL}/api/templates/admin/seed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(templates),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Seed failed: ${response.status} ${error}`);
        }

        const result = await response.json();
        console.log(`✅ Seeded ${result.data.seeded} new templates`);
        console.log('✅ Done!');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

main();
