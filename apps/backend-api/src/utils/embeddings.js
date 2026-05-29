import OpenAI from 'openai';

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

export const generateEmbedding = async (text) => {
  const openai = getOpenAIClient();

  if (!openai) {
    console.warn('OPENAI_API_KEY is missing. Returning mock embedding.');
    return new Array(1536).fill(0);
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });

  return response.data?.[0]?.embedding || [];
};
