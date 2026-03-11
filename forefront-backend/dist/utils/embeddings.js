// Lazy-loaded to prevent blocking server startup (fastembed downloads models on import)
let embeddingModel = null;
export const generateEmbedding = async (text) => {
    try {
        if (!embeddingModel) {
            const { FlagEmbedding, EmbeddingModel } = await import("fastembed");
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
//# sourceMappingURL=embeddings.js.map