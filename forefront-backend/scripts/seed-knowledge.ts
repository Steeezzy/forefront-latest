import { KnowledgeService } from '../src/modules/knowledge/knowledge.service.js';
import { pool } from '../src/config/db.js';

const run = async () => {
    try {
        const service = new KnowledgeService();
        const workspaceId = '6820b0dc-e53c-49fe-813d-b361272bf572'; // From previous query
        const agentId = 'd97e60d2-0818-468e-afaf-6d5e689457c9';     // From previous query

        console.log('🌱 Seeding knowledge...');
        const result = await service.addSource(
            workspaceId,
            agentId,
            'text',
            'Questron is an AI-powered customer support platform. Our refund policy allows refunds within 30 days. We offer 24/7 support.'
        );
        console.log('✅ Knowledge seeded:', result);

    } catch (e) {
        console.error('❌ Error seeding:', e);
    } finally {
        await pool.end();
    }
};

run();
