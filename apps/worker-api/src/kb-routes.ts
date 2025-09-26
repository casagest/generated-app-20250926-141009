import { Hono } from "hono";
import { Env } from "./core-utils";
import OpenAI from 'openai';
const kb = new Hono<{ Bindings: Env }>();
// Endpoint to trigger ingestion of a document from R2 into Vectorize
kb.post('/api/kb/ingest', async (c) => {
  const { r2Key } = await c.req.json();
  if (!r2Key || typeof r2Key !== 'string') {
    return c.json({ success: false, error: 'r2Key is required' }, 400);
  }
  try {
    // Check if the object exists in R2
    const object = await c.env.MEDICALCOR_FILES.get(r2Key);
    if (object === null) {
      return c.json({ success: false, error: `Object not found in R2: ${r2Key}` }, 404);
    }
    // Send a message to the queue to process this file
    await c.env.KB_INGESTION_QUEUE.send({ r2Key });
    return c.json({ success: true, data: { message: `Ingestion queued for ${r2Key}` } });
  } catch (error) {
    console.error('Failed to queue ingestion:', error);
    return c.json({ success: false, error: 'Failed to queue ingestion task' }, 500);
  }
});
// Endpoint for RAG-powered chat
kb.post('/api/kb/chat', async (c) => {
  const { query } = await c.req.json();
  if (!query || typeof query !== 'string') {
    return c.json({ success: false, error: 'Query is required' }, 400);
  }
  try {
    const client = new OpenAI({
      baseURL: c.env.CF_AI_BASE_URL,
      apiKey: c.env.CF_AI_API_KEY,
    });
    // 1. Generate an embedding for the user's query
    const embeddingResponse = await client.embeddings.create({
      model: '@cf/baai/bge-base-en-v1.5',
      input: query,
    });
    const queryVector = embeddingResponse.data[0].embedding;
    // 2. Query Vectorize to find similar documents
    const vectorMatches = await c.env.MEDICALCOR_KB.query(queryVector, { topK: 3 });
    const context = vectorMatches.matches.map(match => match.metadata?.text || '').join('\n\n');
    // 3. Augment the prompt and get a response from the LLM
    const systemPrompt = `You are an expert AI assistant for Aura Dental. Answer the user's question based on the following context from our knowledge base. If the context doesn't contain the answer, say you don't have that information.
    Context:
    ---
    ${context}
    ---
    `;
    const completion = await client.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
    });
    const answer = completion.choices[0]?.message?.content;
    return c.json({ success: true, data: { answer } });
  } catch (error) {
    console.error('RAG chat error:', error);
    return c.json({ success: false, error: 'Failed to process RAG chat query' }, 500);
  }
});
export const kbRoutes = kb;