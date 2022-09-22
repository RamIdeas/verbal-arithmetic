import { onMount } from 'svelte';
import { webVitals } from '../analytics';
import type { Load } from '@sveltejs/kit';

export let routeId: string;

export const load: Load = async ({ routeId }) => ({
	props: { routeId }
});

const analyticsId = import.meta.env.VERCEL_ANALYTICS_ID as string;

onMount(() => {
	if (analyticsId) webVitals({ routeId, analyticsId });
});
