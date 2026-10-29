# Contentful + Next.js site

A landing page whose content (text, images, section order) is managed in Contentful.

## First-time setup

1. In Contentful, go to **Settings → CMA tokens → Create personal access token** and copy it.
2. Paste it into `.env.local`:
   ```
   CONTENTFUL_MANAGEMENT_TOKEN=your-token
   ```
   If your account has more than one space, also set `CONTENTFUL_SPACE_ID`.
3. Run:
   ```bash
   npm run setup
   npm run dev
   ```
4. Open http://localhost:3000.

`npm run setup` creates the content types, sample content, and a Delivery/Preview API key,
then writes those tokens into `.env.local`. It is safe to re-run: content types are updated,
but existing entries are never overwritten.

## Content model

| Content type   | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| Page           | A URL. Slug `home` is `/`; any other slug is served at `/slug`. |
| Hero           | Heading, subheading, button, optional image                    |
| Feature grid   | Heading plus a list of Feature items                           |
| Feature item   | Icon (emoji), title, description                               |
| Testimonial    | Quote, author name, author role                                |
| Call to action | Heading, body, button                                          |

To add a page, create a **Page** entry in Contentful, give it a slug, add sections, and publish.

## How updates show up

Content is cached for about a minute. After publishing in Contentful, refresh the page after
a minute to see the change. Set `CONTENTFUL_PREVIEW=true` in `.env.local` to show draft
(unpublished) content locally.

## Code layout

- `scripts/setup-contentful.mjs` – creates the content model and sample content
- `src/lib/contentful.ts` – fetches pages from the Contentful Delivery API
- `src/components/sections.tsx` – one React component per section type
- `src/app/page.tsx` – homepage; `src/app/[slug]/page.tsx` – all other pages
