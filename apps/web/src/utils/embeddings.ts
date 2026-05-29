import { pipeline } from '@xenova/transformers';

let embedder: any = null;

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!embedder) {
    console.log('[Embeddings] Loading all-MiniLM-L6-v2...');
    embedder = await pipeline(
      'feature-extraction', 
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('[Embeddings] Model ready');
  }
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
