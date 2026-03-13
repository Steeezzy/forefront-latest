import { pipeline } from '@xenova/transformers';

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    console.log('[Embeddings] Loading all-MiniLM-L6-v2 model (Lightweight)...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('[Embeddings] Model loaded successfully');
  }
  return embedder;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embed = await getEmbedder();
  console.log('[Embeddings] Generating local embedding...');
  const output = await embed(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
