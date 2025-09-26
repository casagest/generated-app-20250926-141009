const UTM_STORAGE_KEY = 'aura_utm_params';
const UTM_EXPIRATION_DAYS = 180;
interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  timestamp: number;
}
export function captureUtmParams(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmKeys: (keyof Omit<UtmParams, 'timestamp'>)[] = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    let capturedParams: Partial<UtmParams> = {};
    utmKeys.forEach(key => {
      if (params.has(key)) {
        capturedParams[key] = params.get(key) as string;
      }
    });
    if (Object.keys(capturedParams).length > 0) {
      const dataToStore: UtmParams = {
        ...capturedParams,
        timestamp: new Date().getTime(),
      };
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(dataToStore));
    }
  } catch (error) {
    console.error("Failed to capture UTM parameters:", error);
  }
}
export function getUtmParams(): Omit<UtmParams, 'timestamp'> | null {
  try {
    const storedData = localStorage.getItem(UTM_STORAGE_KEY);
    if (!storedData) {
      return null;
    }
    const parsedData: UtmParams = JSON.parse(storedData);
    const now = new Date().getTime();
    const expirationTime = UTM_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
    if (now - parsedData.timestamp > expirationTime) {
      localStorage.removeItem(UTM_STORAGE_KEY);
      return null;
    }
    const { timestamp, ...utmValues } = parsedData;
    return utmValues;
  } catch (error) {
    console.error("Failed to retrieve UTM parameters:", error);
    return null;
  }
}