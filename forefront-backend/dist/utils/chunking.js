import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
export const splitText = async (text, chunkSize = 800, chunkOverlap = 100) => {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
    });
    const output = await splitter.createDocuments([text]);
    return output.map((doc) => doc.pageContent);
};
//# sourceMappingURL=chunking.js.map