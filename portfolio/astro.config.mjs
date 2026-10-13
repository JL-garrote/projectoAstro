// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
	redirects: {
		// La antigua página de contacto ahora es una app del escritorio
		'/contact': '/#contacto',
	},
});
