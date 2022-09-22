import type { Metric } from 'web-vitals';
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';

const vitalsUrl = `https://vitals.vercel-insights.com/v1/vitals`;

type AnalyticsOptions = {
	routeId: string;
	analyticsId: string;
	debug?: true;
};

export function webVitals(options: AnalyticsOptions): void {
	try {
		getFID((metric) => sendToAnalytics(metric, options));
		getTTFB((metric) => sendToAnalytics(metric, options));
		getLCP((metric) => sendToAnalytics(metric, options));
		getCLS((metric) => sendToAnalytics(metric, options));
		getFCP((metric) => sendToAnalytics(metric, options));
	} catch (err) {
		console.error('[Analytics]', err);
	}
}

function sendToAnalytics(metric: Metric, options: AnalyticsOptions) {
	const body = {
		dsn: options.analyticsId,
		id: metric.id,
		page: options.routeId,
		href: location.href,
		event_name: metric.name,
		value: metric.value.toString(),
		speed: navigator.connection.effectiveType
	};

	if (options.debug) {
		console.log('[Analytics]', metric.name, JSON.stringify(body, null, 2));
	}

	const blob = new Blob([new URLSearchParams(body).toString()], {
		// This content type is necessary for `sendBeacon`:
		type: 'application/x-www-form-urlencoded'
	});
	if (navigator.sendBeacon) {
		navigator.sendBeacon(vitalsUrl, blob);
	} else {
		fetch(vitalsUrl, {
			body: blob,
			method: 'POST',
			credentials: 'omit',
			keepalive: true
		});
	}
}
