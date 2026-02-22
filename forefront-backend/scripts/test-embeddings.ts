import { generateEmbedding } from '../src/utils/embeddings.js';

(async () => {
    try {
        console.log("Testing embedding...");
        const vector = await generateEmbedding("Hello world");
        console.log("Vector length:", vector.length);
    } catch (e) {
        console.error("Embedding Test Failed:", e);
        process.exit(1);
    }
})();
