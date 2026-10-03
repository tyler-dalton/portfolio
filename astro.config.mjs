// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import rehypeMermaid from 'rehype-mermaid';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: "https://tylerdalton.dev",

  integrations: [sitemap(), mdx()],

  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid', 'math'],
    },
    processor: unified({
      rehypePlugins: [rehypeMermaid],
    }),
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
