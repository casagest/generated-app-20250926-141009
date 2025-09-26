import { MiddlewareHandler } from 'hono';
interface LogData {
  level: 'info' | 'error';
  message: string;
  traceId: string;
  method: string;
  path: string;
  status?: number;
  duration?: number;
  error?: any;
}
const log = (data: LogData) => {
  console.log(JSON.stringify(data));
};
export const jsonLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = Date.now();
    const traceId = c.req.header('cf-request-id') || crypto.randomUUID();
    log({
      level: 'info',
      message: 'Request received',
      traceId,
      method: c.req.method,
      path: c.req.path,
    });
    await next();
    const duration = Date.now() - start;
    const status = c.res.status;
    if (status >= 400) {
      log({
        level: 'error',
        message: 'Request failed',
        traceId,
        method: c.req.method,
        path: c.req.path,
        status,
        duration,
      });
    } else {
      log({
        level: 'info',
        message: 'Request successful',
        traceId,
        method: c.req.method,
        path: c.req.path,
        status,
        duration,
      });
    }
  };
};