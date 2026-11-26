import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Fills {{name}}, {{role}} and {{intro}} in index.html from site.config.json,
// so the browser tab title and link previews always match your details.
function siteInfo() {
  return {
    name: 'site-info',
    transformIndexHtml(html) {
      const site = JSON.parse(readFileSync(new URL('./site.config.json', import.meta.url), 'utf8'));
      const esc = (s = '') =>
        String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
      return html.replace(/\{\{(\w+)\}\}/g, (_, key) => esc(site[key]));
    },
  };
}

export default defineConfig({
  // Relative paths: the site works at any address (username.github.io or username.github.io/repo-name).
  base: './',
  plugins: [siteInfo()],
  server: { watch: { ignored: ['**/portfolio/**'] } },
});
