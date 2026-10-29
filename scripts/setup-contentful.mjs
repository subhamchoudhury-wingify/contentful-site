// Creates the content model, sample content, and API keys in Contentful,
// then writes the generated tokens into .env.local.
//
// Usage: npm run setup
// Requires CONTENTFUL_MANAGEMENT_TOKEN in .env.local (CONTENTFUL_SPACE_ID is optional
// if your account only has one space).

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ENV_FILE = resolve(process.cwd(), ".env.local");
const CMA = "https://api.contentful.com";
const API_KEY_NAME = "Next.js website";

const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
let spaceId = process.env.CONTENTFUL_SPACE_ID;
const environmentId = process.env.CONTENTFUL_ENVIRONMENT || "master";

if (!managementToken) {
  fail(
    "CONTENTFUL_MANAGEMENT_TOKEN is empty in .env.local.\n" +
      "Create one in Contentful: Settings -> CMA tokens -> Create personal access token.",
  );
}

// ---------------------------------------------------------------------------
// Content model
// ---------------------------------------------------------------------------

const internalName = {
  id: "internalName",
  name: "Internal name",
  type: "Symbol",
  required: true,
};

const contentTypes = [
  {
    id: "hero",
    name: "Hero",
    description: "Large banner at the top of a page.",
    displayField: "internalName",
    fields: [
      internalName,
      { id: "heading", name: "Heading", type: "Symbol", required: true },
      { id: "subheading", name: "Subheading", type: "Text" },
      { id: "ctaLabel", name: "Button label", type: "Symbol" },
      { id: "ctaUrl", name: "Button URL", type: "Symbol" },
      {
        id: "image",
        name: "Image",
        type: "Link",
        linkType: "Asset",
        validations: [{ linkMimetypeGroup: ["image"] }],
      },
    ],
  },
  {
    id: "featureItem",
    name: "Feature item",
    description: "A single feature shown inside a Feature grid.",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true },
      { id: "description", name: "Description", type: "Text" },
      { id: "icon", name: "Icon (emoji)", type: "Symbol" },
    ],
  },
  {
    id: "featureGrid",
    name: "Feature grid",
    description: "A grid of feature items.",
    displayField: "internalName",
    fields: [
      internalName,
      { id: "heading", name: "Heading", type: "Symbol" },
      { id: "subheading", name: "Subheading", type: "Text" },
      {
        id: "features",
        name: "Features",
        type: "Array",
        items: {
          type: "Link",
          linkType: "Entry",
          validations: [{ linkContentType: ["featureItem"] }],
        },
      },
    ],
  },
  {
    id: "testimonial",
    name: "Testimonial",
    description: "A customer quote.",
    displayField: "internalName",
    fields: [
      internalName,
      { id: "quote", name: "Quote", type: "Text", required: true },
      { id: "authorName", name: "Author name", type: "Symbol", required: true },
      { id: "authorRole", name: "Author role", type: "Symbol" },
    ],
  },
  {
    id: "callToAction",
    name: "Call to action",
    description: "A closing banner with a button.",
    displayField: "internalName",
    fields: [
      internalName,
      { id: "heading", name: "Heading", type: "Symbol", required: true },
      { id: "body", name: "Body", type: "Text" },
      { id: "buttonLabel", name: "Button label", type: "Symbol" },
      { id: "buttonUrl", name: "Button URL", type: "Symbol" },
    ],
  },
  {
    id: "page",
    name: "Page",
    description: "A website page made of sections. The page with slug \"home\" is the homepage.",
    displayField: "title",
    fields: [
      { id: "title", name: "Title", type: "Symbol", required: true },
      {
        id: "slug",
        name: "Slug",
        type: "Symbol",
        required: true,
        validations: [
          { unique: true },
          {
            regexp: { pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
            message: "Use lowercase letters, numbers, and hyphens only.",
          },
        ],
      },
      { id: "seoDescription", name: "SEO description", type: "Text" },
      {
        id: "sections",
        name: "Sections",
        type: "Array",
        items: {
          type: "Link",
          linkType: "Entry",
          validations: [
            { linkContentType: ["hero", "featureGrid", "testimonial", "callToAction"] },
          ],
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sample content
// ---------------------------------------------------------------------------

const heroImage = {
  id: "sample-hero-image",
  title: "Team collaborating",
  url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80&fm=jpg",
  fileName: "hero.jpg",
  contentType: "image/jpeg",
};

const link = (id) => ({ sys: { type: "Link", linkType: "Entry", id } });
const assetLink = (id) => ({ sys: { type: "Link", linkType: "Asset", id } });

// Ordered so referenced entries are published before the entries that use them.
const entries = [
  {
    id: "sample-feature-fast",
    contentType: "featureItem",
    fields: {
      title: "Fast by default",
      description: "Pages are prerendered and served from the edge, so visitors never wait.",
      icon: "⚡",
    },
  },
  {
    id: "sample-feature-editable",
    contentType: "featureItem",
    fields: {
      title: "Edit without developers",
      description: "Marketing can change copy, images, and section order directly in Contentful.",
      icon: "✏️",
    },
  },
  {
    id: "sample-feature-flexible",
    contentType: "featureItem",
    fields: {
      title: "Flexible sections",
      description: "Mix and match heroes, feature grids, testimonials, and calls to action.",
      icon: "🧩",
    },
  },
  {
    id: "sample-home-hero",
    contentType: "hero",
    fields: {
      internalName: "Home - Hero",
      heading: "Build pages your whole team can edit",
      subheading:
        "This page is powered by Contentful. Change any text or image in Contentful and it shows up here within a minute.",
      ctaLabel: "Learn more",
      ctaUrl: "/about",
      image: assetLink(heroImage.id),
    },
  },
  {
    id: "sample-home-features",
    contentType: "featureGrid",
    fields: {
      internalName: "Home - Features",
      heading: "Why teams love it",
      subheading: "Everything you need to launch and iterate on marketing pages.",
      features: [
        link("sample-feature-fast"),
        link("sample-feature-editable"),
        link("sample-feature-flexible"),
      ],
    },
  },
  {
    id: "sample-home-testimonial",
    contentType: "testimonial",
    fields: {
      internalName: "Home - Testimonial",
      quote:
        "We used to wait a week for a copy change. Now our marketing team ships updates the same afternoon.",
      authorName: "Priya Sharma",
      authorRole: "Head of Marketing, Northwind",
    },
  },
  {
    id: "sample-home-cta",
    contentType: "callToAction",
    fields: {
      internalName: "Home - Call to action",
      heading: "Ready to get started?",
      body: "Open Contentful, edit this text, and refresh the page to see it change.",
      buttonLabel: "Open Contentful",
      buttonUrl: "https://app.contentful.com",
    },
  },
  {
    id: "sample-about-hero",
    contentType: "hero",
    fields: {
      internalName: "About - Hero",
      heading: "About us",
      subheading:
        "This second page uses the same section types. Create a new Page entry in Contentful to add more pages.",
      ctaLabel: "Back to home",
      ctaUrl: "/",
    },
  },
  {
    id: "sample-page-home",
    contentType: "page",
    fields: {
      title: "Home",
      slug: "home",
      seoDescription: "A landing page built with Next.js and Contentful.",
      sections: [
        link("sample-home-hero"),
        link("sample-home-features"),
        link("sample-home-testimonial"),
        link("sample-home-cta"),
      ],
    },
  },
  {
    id: "sample-page-about",
    contentType: "page",
    fields: {
      title: "About",
      slug: "about",
      seoDescription: "About this site.",
      sections: [link("sample-about-hero"), link("sample-home-cta")],
    },
  },
];

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

await main();

async function main() {
  if (!spaceId) spaceId = await pickSpace();
  console.log(`Using space ${spaceId}, environment "${environmentId}"\n`);

  const envPath = `/spaces/${spaceId}/environments/${environmentId}`;
  const locale = await getDefaultLocale(envPath);

  console.log("Content types:");
  for (const contentType of contentTypes) {
    await upsertContentType(envPath, contentType);
  }

  console.log("\nAssets:");
  await createAssetIfMissing(envPath, locale, heroImage);

  console.log("\nEntries:");
  for (const entry of entries) {
    await createEntryIfMissing(envPath, locale, entry);
  }

  console.log("\nAPI keys:");
  const tokens = await getOrCreateApiKey();

  await updateEnvFile({
    CONTENTFUL_SPACE_ID: spaceId,
    CONTENTFUL_ENVIRONMENT: environmentId,
    CONTENTFUL_DELIVERY_TOKEN: tokens.delivery,
    CONTENTFUL_PREVIEW_TOKEN: tokens.preview,
  });

  console.log("\nDone. Tokens were saved to .env.local.");
  console.log("Run `npm run dev` and open http://localhost:3000");
}

async function pickSpace() {
  const { items } = await cma("GET", "/spaces");
  if (items.length === 1) return items[0].sys.id;
  if (items.length === 0) fail("This token has no access to any Contentful space.");
  fail(
    "Your account has several spaces. Set CONTENTFUL_SPACE_ID in .env.local to one of:\n" +
      items.map((s) => `  ${s.sys.id}  (${s.name})`).join("\n"),
  );
}

async function getDefaultLocale(envPath) {
  const { items } = await cma("GET", `${envPath}/locales`);
  const locale = items.find((l) => l.default) ?? items[0];
  return locale.code;
}

async function upsertContentType(envPath, { id, ...body }) {
  const path = `${envPath}/content_types/${id}`;
  const existing = await cma("GET", path, undefined, {}, { allow404: true });
  const saved = await cma(
    "PUT",
    path,
    body,
    existing ? { "X-Contentful-Version": existing.sys.version } : {},
  );
  await cma("PUT", `${path}/published`, undefined, {
    "X-Contentful-Version": saved.sys.version,
  });
  console.log(`  ${existing ? "updated" : "created"}  ${id}`);
}

async function createAssetIfMissing(envPath, locale, asset) {
  const path = `${envPath}/assets/${asset.id}`;
  if (await cma("GET", path, undefined, {}, { allow404: true })) {
    console.log(`  exists   ${asset.id}`);
    return;
  }

  try {
    let saved = await cma("PUT", path, {
      fields: {
        title: { [locale]: asset.title },
        file: {
          [locale]: {
            contentType: asset.contentType,
            fileName: asset.fileName,
            upload: asset.url,
          },
        },
      },
    });
    await cma("PUT", `${path}/files/${locale}/process`, undefined, {
      "X-Contentful-Version": saved.sys.version,
    });

    for (let attempt = 0; attempt < 20; attempt++) {
      await sleep(1000);
      saved = await cma("GET", path);
      if (saved.fields.file?.[locale]?.url) break;
    }
    if (!saved.fields.file?.[locale]?.url) throw new Error("image processing timed out");

    await cma("PUT", `${path}/published`, undefined, {
      "X-Contentful-Version": saved.sys.version,
    });
    console.log(`  created  ${asset.id}`);
  } catch (error) {
    console.warn(`  skipped  ${asset.id} (${error.message}); the hero will render without an image`);
  }
}

async function createEntryIfMissing(envPath, locale, { id, contentType, fields }) {
  const path = `${envPath}/entries/${id}`;
  if (await cma("GET", path, undefined, {}, { allow404: true })) {
    console.log(`  exists   ${id}`);
    return;
  }

  const localized = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, { [locale]: value }]),
  );
  const saved = await cma(
    "PUT",
    path,
    { fields: localized },
    { "X-Contentful-Content-Type": contentType },
  );

  try {
    await cma("PUT", `${path}/published`, undefined, {
      "X-Contentful-Version": saved.sys.version,
    });
    console.log(`  created  ${id}`);
  } catch (error) {
    // Usually a reference to an asset that failed to upload; drop it and retry.
    if (fields.image) {
      delete localized.image;
      const retry = await cma("PUT", path, { fields: localized }, {
        "X-Contentful-Version": saved.sys.version,
      });
      await cma("PUT", `${path}/published`, undefined, {
        "X-Contentful-Version": retry.sys.version,
      });
      console.log(`  created  ${id} (without image)`);
    } else {
      throw error;
    }
  }
}

async function getOrCreateApiKey() {
  const { items } = await cma("GET", `/spaces/${spaceId}/api_keys`);
  let apiKey = items.find((key) => key.name === API_KEY_NAME);

  if (apiKey) {
    console.log(`  exists   "${API_KEY_NAME}"`);
  } else {
    apiKey = await cma("POST", `/spaces/${spaceId}/api_keys`, {
      name: API_KEY_NAME,
      description: "Used by the Next.js site to read content.",
      environments: [{ sys: { type: "Link", linkType: "Environment", id: environmentId } }],
    });
    console.log(`  created  "${API_KEY_NAME}"`);
  }

  const preview = await cma(
    "GET",
    `/spaces/${spaceId}/preview_api_keys/${apiKey.preview_api_key.sys.id}`,
  );
  return { delivery: apiKey.accessToken, preview: preview.accessToken };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function cma(method, path, body, headers = {}, { allow404 = false } = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(`${CMA}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${managementToken}`,
        "Content-Type": "application/vnd.contentful.management.v1+json",
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 429) {
      const wait = Number(response.headers.get("X-Contentful-RateLimit-Reset") ?? 1);
      await sleep(Math.max(wait, 1) * 1000);
      continue;
    }
    if (response.status === 404 && allow404) return null;

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const details = data?.details?.errors ? `\n${JSON.stringify(data.details.errors, null, 2)}` : "";
      const message = `${method} ${path} failed (${response.status}): ${data?.message ?? text}${details}`;
      if (response.status === 401) fail(`${message}\nCheck CONTENTFUL_MANAGEMENT_TOKEN in .env.local.`);
      if (response.status === 404 && path.startsWith(`/spaces/${spaceId}`)) {
        fail(`${message}\nCheck CONTENTFUL_SPACE_ID and CONTENTFUL_ENVIRONMENT in .env.local.`);
      }
      throw new Error(message);
    }
    return data;
  }
  throw new Error(`${method} ${path} kept hitting the rate limit`);
}

async function updateEnvFile(values) {
  let contents = "";
  try {
    contents = await readFile(ENV_FILE, "utf8");
  } catch {}

  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    contents = pattern.test(contents)
      ? contents.replace(pattern, line)
      : `${contents.trimEnd()}\n${line}\n`;
  }
  await writeFile(ENV_FILE, contents);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}
