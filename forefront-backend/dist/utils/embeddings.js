import { FlagEmbedding, EmbeddingModel } from "fastembed";
// Initialize Local Embedding Model (Runs on your server, no API cost)
// Using BAAI/bge-small-en-v1.5 which outputs 384 dimensions
let embeddingModel = null;
export const generateEmbedding = async (text) => {
    try {
        if (!embeddingModel) {
            embeddingModel = await FlagEmbedding.init({
                model: EmbeddingModel.BGESmallENV15
            });
        }
        const embeddingGenerator = await embeddingModel.embed([text]);
        const vector = (await embeddingGenerator.next()).value?.[0]; // Get the first vector
        if (!vector)
            throw new Error("Failed to generate embedding");
        return Array.from(vector); // Convert Float32Array to number[]
    }
    catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
};
