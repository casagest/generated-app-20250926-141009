import OpenAI from 'openai';
import { Env } from './core-utils';
import { Lead } from '@shared/types';
export interface AIScoreResult {
  score: number;
  explanation: string;
  next_action: string;
}
export class AIService {
  private client: OpenAI;
  constructor(env: Env) {
    this.client = new OpenAI({
      baseURL: env.CF_AI_BASE_URL,
      apiKey: env.CF_AI_API_KEY,
    });
  }
  /**
   * Scores a lead and provides a detailed explanation and next best action.
   * @param leadData - The partial lead data to score.
   * @returns An object containing the score, explanation, and next action.
   */
  async scoreLead(leadData: Pick<Lead, 'name' | 'email' | 'phone' | 'source'>): Promise<AIScoreResult> {
    const prompt = `
      You are an expert lead scoring system for a high-end dental clinic specializing in cosmetic dentistry and implants.
      Analyze the following lead information and return a JSON object with three keys: "score", "explanation", and "next_action".
      - "score": An integer from 1 to 100 indicating the lead's quality.
      - "explanation": A brief, one-sentence explanation for the score.
      - "next_action": A concrete, actionable next step for the call center.
      Scoring criteria:
      - High Score (80-100): Referrals, professional email domains (e.g., company emails), interest in high-value services.
      - Medium Score (40-79): Website or Social Media sources, generic email domains (gmail, yahoo).
      - Low Score (1-39): Vague interest, temporary email domains, advertisement sources which often have lower intent.
      Lead Data:
      - Name: ${leadData.name}
      - Email: ${leadData.email}
      - Phone: ${leadData.phone || 'Not provided'}
      - Source: ${leadData.source}
      Example response for a good lead:
      {
        "score": 85,
        "explanation": "Lead from a direct referral with a professional email, indicating high intent and trust.",
        "next_action": "Prioritize for immediate call-back. Mention the referrer to build rapport."
      }
      Example response for a lower-quality lead:
      {
        "score": 45,
        "explanation": "Lead from a general social media ad with a generic email address; intent may be low.",
        "next_action": "Add to standard call queue. Qualify interest in specific services before scheduling."
      }
      Return ONLY the JSON object.
    `;
    try {
      const completion = await this.client.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });
      const resultText = completion.choices[0]?.message?.content?.trim();
      if (resultText) {
        const result = JSON.parse(resultText) as AIScoreResult;
        if (result.score && result.explanation && result.next_action) {
          return result;
        }
      }
      // Fallback if parsing or validation fails
      return this.getFallbackScore(leadData);
    } catch (error) {
      console.error("Advanced AI lead scoring failed:", error);
      // Return a score from the fallback heuristic on error
      return this.getFallbackScore(leadData);
    }
  }
  /**
   * A simple, rule-based fallback for lead scoring if the AI model fails.
   */
  private getFallbackScore(leadData: Pick<Lead, 'name' | 'email' | 'phone' | 'source'>): AIScoreResult {
    let score = 50;
    let explanation = "Standard lead from an automated source.";
    let next_action = "Add to standard call queue for qualification.";
    switch (leadData.source) {
      case 'Referral':
        score += 30;
        explanation = "High-quality referral lead.";
        next_action = "Prioritize for immediate call-back.";
        break;
      case 'Website':
        score += 10;
        break;
      case 'Chatbot':
        score += 5;
        break;
      case 'Advertisement':
        score -= 10;
        break;
    }
    if (leadData.email.includes('@gmail') || leadData.email.includes('@yahoo') || leadData.email.includes('@hotmail')) {
      // Generic email
    } else {
      // Potentially professional email
      score += 15;
    }
    score = Math.max(1, Math.min(100, score)); // Clamp score between 1 and 100
    return { score, explanation, next_action };
  }
}