import { useEffect } from 'react';
import { captureAttributionParams, getAttributionParams, getSessionId } from '@/lib/attribution';
import { logUtmEvent } from '@/lib/api';
let hasLoggedPageView = false;
export function useAttribution() {
  useEffect(() => {
    if (hasLoggedPageView) {
      return;
    }
    captureAttributionParams();
    const attributionParams = getAttributionParams();
    const sessionId = getSessionId();
    const eventPayload = {
      event_type: 'page_view' as const,
      session_id: sessionId,
      ...attributionParams,
    };
    logUtmEvent(eventPayload)
      .then(() => {
        hasLoggedPageView = true;
        console.log('Page view event logged.');
      })
      .catch(error => {
        console.error('Failed to log page view event:', error);
      });
  }, []);
}