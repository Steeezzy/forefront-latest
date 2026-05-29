import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const splitText = async (text: string, chunkSize: number = 800, chunkOverlap: number = 100): Promise<string[]> => {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
    });

    const output = await splitter.createDocuments([text]);
    return output.map((doc) => doc.pageContent);
};
