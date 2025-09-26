import { Hono } from "hono";
import { Env } from "./core-utils";
const r2 = new Hono<{ Bindings: Env }>();
// Generates a pre-signed URL for uploading a file to R2.
r2.post('/api/files/sign-upload', async (c) => {
  try {
    const { filename, contentType, patientId } = await c.req.json();
    if (!filename || !contentType || !patientId) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    const objectKey = `patients/${patientId}/${crypto.randomUUID()}-${filename}`;
    // Use getSignedUrl for PUT operations (uploads).
    const signedUrl = await c.env.MEDICALCOR_FILES.getSignedUrl(objectKey, {
        action: 'upload',
        expires: 300, // 5 minutes
        httpMetadata: { contentType },
    });
    if (contentType.startsWith('image/')) {
        await c.env.MEDIA_QUEUE.send({ r2Key: objectKey });
    }
    return c.json({ success: true, data: { url: signedUrl, key: objectKey } });
  } catch (error) {
    console.error('Failed to sign upload URL:', error);
    return c.json({ success: false, error: 'Could not create upload URL' }, 500);
  }
});
// Generates a pre-signed URL for downloading a file from R2.
r2.get('/api/files/sign-download/:key{.+}', async (c) => {
    try {
        const { key } = c.req.param();
        // The getSignedUrl method is correct for download (GET) operations.
        const signedUrl = await c.env.MEDICALCOR_FILES.getSignedUrl(key, {
            action: 'download',
            expires: 300, // 5 minutes
        });
        return c.json({ success: true, data: { url: signedUrl } });
    } catch (error) {
        console.error('Failed to sign download URL:', error);
        return c.json({ success: false, error: 'Could not create download URL' }, 500);
    }
});
export const r2Routes = r2;