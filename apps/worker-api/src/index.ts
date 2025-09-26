import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./core-utils";
import { API_RESPONSES } from "./config";
import { userRoutes, coreRoutes } from "./userRoutes";
import { r2Routes } from "./r2-routes";
import { kbRoutes } from "./kb-routes";
import { pbxRoutes } from "./pbx-routes";
import { agencyRoutes } from "./agency-routes";
import { observabilityRoutes } from "./observability-routes";
import { jsonLogger } from "./logger";
import { ChatAgent } from "./agent";
import { AppController } from "./app-controller";
import { LeadLockingDO } from "./locking-do";
import { SessionDO } from "./session-do";
import { DisputeDO } from "./dispute-do";
import { queueHandler as leadQueueHandler } from "./queue-handler";
import { vectorizeHandler as kbQueueHandler } from "./vectorize-handler";
import { auditHandler } from "./audit-handler";
import { mediaHandler } from "./media-handler";
import { leadIntakeHandler } from "./lead-intake-handler";
import { transcriptionHandler } from "./transcription-handler";
import { kpiCronHandler } from "./kpi-cron";
import { settlementCronHandler } from "./settlement-cron";
import { importHandler } from "./import-handler";
import { MessageBatch, ScheduledController } from "@cloudflare/workers-types";
export { ChatAgent, AppController, LeadLockingDO, SessionDO, DisputeDO };
const app = new Hono<{Bindings: Env;}>();
// Apply structured JSON logging middleware to all requests
app.use("*", jsonLogger());
app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Agency-ID"]
  })
);
// Register all route handlers
app.route('/', userRoutes);
app.route('/', coreRoutes);
app.route('/', r2Routes);
app.route('/', kbRoutes);
app.route('/', pbxRoutes);
app.route('/', agencyRoutes);
app.route('/', observabilityRoutes);
app.notFound((c) =>
  c.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 })
);
export default {
  fetch: app.fetch,
  scheduled: async (controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> => {
    switch (controller.cron) {
      case "0 1 * * *": // Daily KPI job
        ctx.waitUntil(kpiCronHandler(env));
        break;
      case "0 2 1 * *": // Monthly settlement job
        ctx.waitUntil(settlementCronHandler(env));
        break;
      default:
        console.error(`Unknown cron job: ${controller.cron}`);
        break;
    }
  },
  queue: async (batch: MessageBatch<any>, env: Env, ctx: ExecutionContext): Promise<void> => {
    switch (batch.queue) {
      case 'lead-processing-queue':
        await leadQueueHandler(batch, env, ctx);
        break;
      case 'kb-ingestion-queue':
        await kbQueueHandler(batch, env, ctx);
        break;
      case 'audit-queue':
        await auditHandler(batch, env);
        break;
      case 'media-queue':
        await mediaHandler(batch, env);
        break;
      case 'lead-intake-queue':
        await leadIntakeHandler(batch, env);
        break;
      case 'transcription-queue':
        await transcriptionHandler(batch, env);
        break;
      case 'import-queue':
        await importHandler(batch, env);
        break;
      default:
        console.error(`Unknown queue: ${batch.queue}`);
        batch.messages.forEach((msg) => msg.retry());
        break;
    }
  },
} satisfies ExportedHandler<Env>;