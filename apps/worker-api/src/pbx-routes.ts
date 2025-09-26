import { Hono } from "hono";
import { Env } from "./core-utils";
import { CallLog } from "@shared/types";
const pbx = new Hono<{ Bindings: Env }>();
// This endpoint would be called by your PBX provider (e.g., Twilio, Vonage) when a call ends.
pbx.post('/api/pbx/webhook/call-event', async (c) => {
  try {
    const body = await c.req.json();
    // Normalize data from a hypothetical PBX webhook payload
    const { from, to, duration, recordingUrl, direction } = body;
    const phoneNumber = direction === 'inbound' ? from : to;
    // Find a matching lead or patient by phone number
    const lead = await c.env.MEDICALCOR_DB.prepare("SELECT id FROM leads WHERE phone = ? LIMIT 1").bind(phoneNumber).first<{ id: string }>();
    const newCallLog: Omit<CallLog, 'created_at'> = {
      id: crypto.randomUUID(),
      lead_id: lead?.id || null,
      patient_id: lead?.id || null, // Assuming lead_id and patient_id are the same for now
      phone_number: phoneNumber,
      direction: direction,
      duration_seconds: duration,
      recording_url: recordingUrl,
      ai_summary: null,
    };
    await c.env.MEDICALCOR_DB.prepare(
      "INSERT INTO call_logs (id, lead_id, patient_id, phone_number, direction, duration_seconds, recording_url) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      newCallLog.id,
      newCallLog.lead_id,
      newCallLog.patient_id,
      newCallLog.phone_number,
      newCallLog.direction,
      newCallLog.duration_seconds,
      newCallLog.recording_url
    ).run();
    // If there's a recording, dispatch a job to the transcription queue
    if (recordingUrl) {
      await c.env.TRANSCRIPTION_QUEUE.send({
        callLogId: newCallLog.id,
        recordingUrl: recordingUrl,
      });
    }
    return c.json({ success: true, data: { message: "Call log created." } }, 201);
  } catch (error) {
    console.error('PBX Webhook Error:', error);
    return c.json({ success: false, error: 'Failed to process call event.' }, 500);
  }
});
export const pbxRoutes = pbx;