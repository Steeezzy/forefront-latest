import { pipeline } from '@xenova/transformers';

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    console.log('[Embeddings] Loading nomic-embed-text model...');
    embedder = await pipeline('feature-extraction', 'Xenova/nomic-embed-text-v1');
    console.log('[Embeddings] Model loaded successfully');
  }
  return embedder;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embed = await getEmbedder();
  const output = await embed(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
