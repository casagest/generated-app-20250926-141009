const ATTRIBUTION_STORAGE_KEY = 'aura_attribution_params';
const ATTRIBUTION_EXPIRATION_DAYS = 180;
const SESSION_ID_KEY = 'aura_session_id';
interface AttributionParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  timestamp: number;
}
export function getSessionId(): string {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
}
export function captureAttributionParams(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const keys: (keyof Omit<AttributionParams, 'timestamp'>)[] = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'
    ];
    let capturedParams: Partial<AttributionParams> = {};
    let hasNewParams = false;
    keys.forEach(key => {
      if (params.has(key)) {
        capturedParams[key] = params.get(key) as string;
        hasNewParams = true;
      }
    });
    if (hasNewParams) {
      const dataToStore: AttributionParams = {
        ...capturedParams,
        timestamp: new Date().getTime(),
      };
      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(dataToStore));
    }
  } catch (error) {
    console.error("Failed to capture attribution parameters:", error);
  }
}
export function getAttributionParams(): Omit<AttributionParams, 'timestamp'> | null {
  try {
    const storedData = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!storedData) {
      return null;
    }
    const parsedData: AttributionParams = JSON.parse(storedData);
    const now = new Date().getTime();
    const expirationTime = ATTRIBUTION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
    if (now - parsedData.timestamp > expirationTime) {
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      return null;
    }
    const { timestamp, ...attributionValues } = parsedData;
    return attributionValues;
  } catch (error) {
    console.error("Failed to retrieve attribution parameters:", error);
    return null;
  }
}