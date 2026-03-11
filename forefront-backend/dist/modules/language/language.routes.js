import { sarvamClient } from '../../services/SarvamClient.js';
import { z } from 'zod';
const TranslateSchema = z.object({
    text: z.string().min(1),
    source_language: z.string().default('en-IN'),
    target_language: z.string().default('hi-IN')
});
export const languageRoutes = async (fastify) => {
    // POST /language/translate
    fastify.post('/translate', async (request, reply) => {
        try {
            const body = TranslateSchema.parse(request.body);
            const translatedText = await sarvamClient.translate(body.text, body.source_language, body.target_language);
            return { translated_text: translatedText };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: error.message || "Translation failed" });
        }
    });
    // POST /language/identify - (Not implemented in SarvamClient yet, but placeholder)
    // If Sarvam adds /language-identification, we can map it here.
};
//# sourceMappingURL=language.routes.js.map