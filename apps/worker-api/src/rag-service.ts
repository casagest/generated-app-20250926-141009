import { Env } from './core-utils';
import OpenAI from 'openai';
interface QualificationResult {
  response: string;
  isQualified: boolean;
  updatedFields: {
    name?: string;
    email?: string;
    phone?: string;
    interest?: string;
  };
}
export class RAGService {
  private env: Env;
  private client: OpenAI;
  constructor(env: Env) {
    this.env = env;
    this.client = new OpenAI({
      baseURL: env.CF_AI_BASE_URL,
      apiKey: env.CF_AI_API_KEY,
    });
  }
  async answerQuery(query: string): Promise<string> {
    const embeddingResponse = await this.client.embeddings.create({
      model: '@cf/baai/bge-base-en-v1.5',
      input: query,
    });
    const queryVector = embeddingResponse.data[0].embedding;
    const vectorMatches = await this.env.MEDICALCOR_KB.query(queryVector, { topK: 3 });
    const context = vectorMatches.matches.map(match => match.metadata?.text || '').join('\n\n');
    const systemPrompt = `You are an expert AI assistant for Aura Dental. Answer the user's question based on the following context from our knowledge base. If the context doesn't contain the answer, say you don't have that information but can help with other questions.
    Context:
    ---
    ${context}
    ---
    `;
    const completion = await this.client.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
    });
    return completion.choices[0]?.message?.content || "I'm sorry, I couldn't find an answer to that question.";
  }
  async qualifyLead(conversation: { role: 'user' | 'assistant'; content: string }[]): Promise<QualificationResult> {
    const prompt = `
      You are an AI assistant for a dental clinic. Your goal is to qualify a lead by collecting their name, email, and phone number.
      Analyze the conversation history and the latest user message.
      1. Extract the user's name, email, and phone number if present.
      2. Determine what information is still missing.
      3. Generate a natural, conversational response to ask for the NEXT piece of missing information.
      4. If you have just collected all three (name, email, phone), your response should be to briefly ask about their dental interest (e.g., "Great, thank you! And what dental service are you interested in today?").
      5. If the user asks a question, use the provided knowledge base context to answer it before continuing with qualification.
      Return a JSON object with the following structure:
      {
        "response": "Your conversational reply to the user.",
        "isQualified": boolean, // true ONLY if name, email, AND phone have been collected.
        "updatedFields": {
          "name": "The user's full name, if found.",
          "email": "The user's email, if found.",
          "phone": "The user's phone number, if found.",
          "interest": "The user's stated interest, if found."
        }
      }
      Conversation History:
      ${JSON.stringify(conversation.slice(-6))}
    `;
    const lastUserMessage = conversation.filter(m => m.role === 'user').pop()?.content || "";
    const context = await this.answerQuery(lastUserMessage);
    const completion = await this.client.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: `Knowledge Base Context:\n${context}` },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
    });
    try {
      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result as QualificationResult;
    } catch (e) {
      return {
        response: "I'm sorry, I had a little trouble understanding that. Could you please repeat it?",
        isQualified: false,
        updatedFields: {},
      };
    }
  }
}