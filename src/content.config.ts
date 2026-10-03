import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.mdx" }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    organization: z.string().optional(),
    role: z.string().optional(),
    location: z.string().optional(),

    period: z.string(),
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
    status: z.enum(["completed", "building", "archived", "maintained"]),

    categories: z.array(
      z.enum(["infrastructure", "development", "cybersecurity", "misc"]),
    ).min(1),
    technologies: z.array(z.string()).min(1),
    summary: z.string(),

    links: z.array(z.object({
      label: z.string(),
      url: z.string().url(),
    })).default([]),

    media: z.object({
      hero: z.string().optional(),
      gallery: z.array(z.object({
        src: z.string(),
        alt: z.string(),
        caption: z.string().optional(),
      })).default([]),
    }).default({ gallery: [] }),

    show: z.object({
      home: z.object({
        order: z.number().int().min(1).max(3),
      }).optional(),
      projectFeature: z.boolean().default(false),
      resume: z.boolean().default(false),
      timeline: z.boolean().default(false),
    }).default({
      projectFeature: false,
      resume: false,
      timeline: false,
    }),
  }),
});

export const collections = { projects };
