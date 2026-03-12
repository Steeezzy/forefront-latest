import { pool } from './src/config/db.js';

async function migrate() {
    try {
        console.log('Applying migration 012 (unanswered_questions portion)...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS unanswered_questions (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
              question TEXT NOT NULL,
              normalized_question TEXT, -- For deduplication
              frequency INTEGER DEFAULT 1,
              last_asked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              first_asked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              resolved BOOLEAN DEFAULT false,
              resolved_with UUID REFERENCES knowledge_sources(id),
              suggested_answer TEXT,
              ai_confidence FLOAT,
              created_conversation_ids UUID[] DEFAULT '{}',
              UNIQUE(workspace_id, normalized_question)
            );
        `);
        console.log('Table created (or already existed).');

        await pool.query('CREATE INDEX IF NOT EXISTS idx_unanswered_questions_workspace ON unanswered_questions(workspace_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_unanswered_questions_resolved ON unanswered_questions(resolved) WHERE resolved = false');
        console.log('Indexes created.');

        console.log('MIGRATION SUCCESSFUL');
    } catch (e) {
        console.error('MIGRATION FAILED:', e);
    } finally {
        await pool.end();
    }
}

migrate();
