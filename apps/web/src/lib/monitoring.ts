import { env } from './env';

export interface TelemetryEvent {
  name: string;
  category?: 'auth' | 'pos' | 'inventory' | 'staff' | 'payment' | 'navigation';
  properties?: Record<string, unknown>;
  timestamp?: string;
}

class TelemetryService {
  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (env.PROD) {
      console.log('🚀 Telemetry & Error Monitoring active [Production Mode]');
    } else {
      console.log('ℹ️ Telemetry & Error Monitoring running in [Development Mode]');
    }
  }

  public captureException(error: Error | unknown, context?: Record<string, unknown>) {
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
    };

    console.error('[XyntraPOS Error]', errorDetails);

    // If Sentry or third-party logger DSN is present, dispatch event
    if (env.VITE_SENTRY_DSN) {
      // Third-party SDK integration hook point
    }
  }

  public trackEvent(event: TelemetryEvent) {
    const payload = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    if (env.DEV) {
      console.debug('[Telemetry Event]', payload);
    }
  }

  public trackPerformance(metricName: string, durationMs: number) {
    if (env.DEV) {
      console.debug(`[Perf Metric] ${metricName}: ${durationMs.toFixed(2)}ms`);
    }
  }
}

export const monitoring = new TelemetryService();
