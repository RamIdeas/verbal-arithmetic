import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess({
		replace: [
			// this will allow us to use is in the code as import.meta.env.VERCEL_ANALYTICS_ID
			['import.meta.env.VERCEL_ANALYTICS_ID', JSON.stringify(process.env.VERCEL_ANALYTICS_ID)]
		]
	}),

	kit: {
		adapter: adapter()
	}
};

export default config;
