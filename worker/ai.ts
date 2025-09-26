import OpenAI from 'openai';
import { Env } from './core-utils';
import { Lead } from './types';
// This service is for specific, non-conversational AI tasks.
export class AIService {
  private client: OpenAI;
  constructor(env: Env) {
    this.client = new OpenAI({
      baseURL: env.CF_AI_BASE_URL,
      apiKey: env.CF_AI_API_KEY,
    });
  }
  /**
   * Scores a lead based on their provided information using an AI model.
   * @param leadData - The partial lead data to score.
   * @returns A score between 1 and 100, or a default score if AI fails.
   */
  async scoreLead(leadData: Pick<Lead, 'name' | 'email' | 'phone' | 'source'>): Promise<number> {
    const prompt = `
      You are an expert lead scoring system for a dental clinic.
      Analyze the following lead information and provide a score from 1 to 100 indicating the likelihood of this lead becoming a high-value patient.
      A high score (80-100) means a very promising lead. A low score (1-40) means a low-quality lead.
      Consider the source of the lead (Referrals are high quality, Advertisements can be lower).
      A professional-looking email (e.g., not a burner) is a positive signal.
      Lead Data:
      - Name: ${leadData.name}
      - Email: ${leadData.email}
      - Phone: ${leadData.phone || 'Not provided'}
      - Source: ${leadData.source}
      Provide ONLY the integer score as your response. Do not add any explanation or text.
      Example response: 85
    `;
    try {
      const completion = await this.client.chat.completions.create({
        model: 'openai/gpt-4o', // Using a powerful model for better reasoning
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 5,
        temperature: 0.2,
      });
      const scoreText = completion.choices[0]?.message?.content?.trim();
      if (scoreText) {
        const score = parseInt(scoreText, 10);
        if (!isNaN(score) && score >= 1 && score <= 100) {
          return score;
        }
      }
      // Fallback if parsing fails
      return 50;
    } catch (error) {
      console.error("AI lead scoring failed:", error);
      // Return a default median score on error to avoid blocking lead creation
      return 50;
    }
  }
}