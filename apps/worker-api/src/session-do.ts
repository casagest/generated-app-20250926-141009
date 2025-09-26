import { DurableObject } from 'cloudflare:workers';
import { Env } from './core-utils';
import { RAGService } from './rag-service';
import { WebSocketMessage, LeadIntakePayload } from '@shared/types';
interface SessionState {
  name?: string;
  email?: string;
  phone?: string;
  interest?: string;
  conversation: { role: 'user' | 'assistant'; content: string }[];
}
export class SessionDO extends DurableObject<Env> {
  private state: SessionState;
  private ragService: RAGService;
  private webSocket?: WebSocket;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.state = { conversation: [] };
    this.ragService = new RAGService(env);
  }
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }
    const [client, server] = Object.values(new WebSocketPair());
    await this.handleSession(server);
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
  async handleSession(ws: WebSocket) {
    this.webSocket = ws;
    ws.accept();
    const welcomeMessage = "Hello! I'm the AI assistant for Aura Dental. How can I help you today?";
    this.state.conversation.push({ role: 'assistant', content: welcomeMessage });
    this.send({ type: 'message', content: welcomeMessage });
    ws.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string) as WebSocketMessage;
        if (data.type === 'message') {
          await this.handleUserMessage(data.content);
        }
      } catch (e) {
        this.sendError('Invalid message format.');
      }
    });
    ws.addEventListener('close', () => {
      this.webSocket = undefined;
    });
    ws.addEventListener('error', () => {
      this.webSocket = undefined;
    });
  }
  private async handleUserMessage(message: string) {
    this.state.conversation.push({ role: 'user', content: message });
    this.send({ type: 'typing', content: '' }); // Send typing indicator
    const qualificationResult = await this.ragService.qualifyLead(this.state.conversation);
    this.state = { ...this.state, ...qualificationResult.updatedFields };
    this.state.conversation.push({ role: 'assistant', content: qualificationResult.response });
    this.send({ type: 'message', content: qualificationResult.response });
    if (qualificationResult.isQualified) {
      const leadPayload: LeadIntakePayload = {
        name: this.state.name!,
        email: this.state.email!,
        phone: this.state.phone!,
        interest: this.state.interest,
        source: 'Chatbot',
      };
      await this.env.LEAD_INTAKE_QUEUE.send(leadPayload);
      const finalMessage = "Thank you! Our team has your information and will be in touch shortly to schedule an appointment.";
      this.state.conversation.push({ role: 'assistant', content: finalMessage });
      this.send({ type: 'message', content: finalMessage });
    }
  }
  private send(message: WebSocketMessage) {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(message));
    }
  }
  private sendError(error: string) {
    this.send({ type: 'error', content: error });
  }
}