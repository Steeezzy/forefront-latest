import { pool } from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function backfill() {
  const shop = 'questron-7108.myshopify.com';
  // Use the ngrok URL from the previous DB check or environment
  const backendUrl = process.env.SHOPIFY_APP_URL || process.env.BACKEND_URL || 'https://6b0f-117-254-5-103.ngrok-free.app';
  const chatbotId = '41a79e94-d2f1-4544-a871-4a179524b96d'; // From DB check
  const accessToken = 'shpua_d8ec53350370e851caabc5f038157ddb'; // From DB check
  const workspaceId = '4052b794-7a55-4531-949e-50804236977b'; // From DB check

  console.log(`Backfilling shop: ${shop}`);
  console.log(`Backend URL: ${backendUrl}`);
  console.log(`Chatbot ID: ${chatbotId}`);
  
  try {
    const result = await pool.query(
      `INSERT INTO shopify_configs (workspace_id, shop_domain, access_token, backend_url, chatbot_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (workspace_id) DO UPDATE SET
         shop_domain = EXCLUDED.shop_domain,
         access_token = EXCLUDED.access_token,
         backend_url = EXCLUDED.backend_url,
         chatbot_id = EXCLUDED.chatbot_id,
         is_active = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [workspaceId, shop, accessToken, backendUrl, chatbotId]
    );
    
    console.log('Backfill complete successfully.');
    console.log('Store ID:', result.rows[0].id);
  } catch (error: any) {
    console.error('Backfill failed:', error.message);
  } finally {
    pool.end();
  }
}

backfill().catch(console.error);
