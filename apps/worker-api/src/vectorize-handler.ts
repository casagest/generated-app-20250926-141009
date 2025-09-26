import { Env } from './core-utils';
import { MessageBatch } from '@cloudflare/workers-types';
import OpenAI from 'openai';
interface IngestionMessage {
  r2Key: string;
}
// Simple text chunking function
function chunkText(text: string, chunkSize = 512, overlap = 50): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
    if (end === text.length) break;
  }
  return chunks;
}
export const vectorizeHandler = async (batch: MessageBatch<IngestionMessage>, env: Env, ctx: ExecutionContext): Promise<void> => {
  const client = new OpenAI({
    baseURL: env.CF_AI_BASE_URL,
    apiKey: env.CF_AI_API_KEY,
  });
  for (const message of batch.messages) {
    try {
      const { r2Key } = message.body;
      console.log(`Ingesting document: ${r2Key}`);
      // 1. Get document from R2
      const object = await env.MEDICALCOR_FILES.get(r2Key);
      if (!object) {
        console.error(`Object not found in R2: ${r2Key}`);
        message.ack();
        continue;
      }
      const text = await object.text();
      // 2. Chunk the text
      const chunks = chunkText(text);
      // 3. Generate embeddings for each chunk
      const embeddingResponse = await client.embeddings.create({
        model: '@cf/baai/bge-base-en-v1.5',
        input: chunks,
      });
      // 4. Prepare vectors for upserting
      const vectors = embeddingResponse.data.map((embedding, i) => ({
        id: `${r2Key}-chunk-${i}`,
        values: embedding.embedding,
        metadata: {
          r2Key,
          text: chunks[i],
        },
      }));
      // 5. Upsert vectors into the Vectorize index
      if (vectors.length > 0) {
        await env.MEDICALCOR_KB.upsert(vectors);
        console.log(`Successfully ingested ${vectors.length} vectors for ${r2Key}`);
      } else {
        console.log(`No chunks to ingest for ${r2Key}`);
      }
      message.ack();
    } catch (err) {
      console.error(`Error processing ingestion message for ${message.body.r2Key}:`, err);
      message.retry();
    }
  }
};