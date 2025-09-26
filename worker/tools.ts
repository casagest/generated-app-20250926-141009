import type { WeatherResult, ErrorResult } from './types';
import { mcpManager } from './mcp-client';
import { createNewLead } from './userRoutes';
import { Env } from './core-utils';
export type ToolResult = WeatherResult | { content: string } | ErrorResult | { leadId: string; message: string };
const customTools = [
  {
    type: 'function' as const,
    function: {
      name: 'create_lead',
      description: 'Creates a new lead in the CRM system with the collected information.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The full name of the potential patient.' },
          email: { type: 'string', description: 'The email address of the potential patient.' },
          phone: { type: 'string', description: 'The phone number of the potential patient.' },
        },
        required: ['name', 'email', 'phone'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Get current weather information for a location',
      parameters: {
        type: 'object',
        properties: { location: { type: 'string', description: 'The city or location name' } },
        required: ['location']
      }
    }
  },
];
export async function getToolDefinitions() {
  const mcpTools = await mcpManager.getToolDefinitions();
  // For this phase, we are focusing on the chatbot, so we remove the web_search tool to avoid confusion.
  // It can be re-added later.
  return [...customTools, ...mcpTools];
}
export async function executeTool(name: string, args: Record<string, unknown>, env: Env): Promise<ToolResult> {
  try {
    switch (name) {
      case 'create_lead': {
        const { name: leadName, email, phone } = args;
        if (typeof leadName !== 'string' || typeof email !== 'string' || typeof phone !== 'string') {
          return { error: 'Invalid arguments for create_lead' };
        }
        const newLead = await createNewLead({ name: leadName, email, phone, source: 'Chatbot' }, env);
        return {
          leadId: newLead.id,
          message: `Successfully created lead for ${newLead.name} with AI score ${newLead.aiScore}.`,
        };
      }
      case 'get_weather':
        return {
          location: args.location as string,
          temperature: Math.floor(Math.random() * 40) - 10,
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
          humidity: Math.floor(Math.random() * 100)
        };
      default: {
        const content = await mcpManager.executeTool(name, args);
        return { content };
      }
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}