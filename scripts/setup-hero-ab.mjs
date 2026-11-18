// Prepares Contentful for a Home Hero A/B test with the VWO FME Wrapper.
// - Allows variationFmeContainer on Page.sections
// - Creates Hero B (variation copy)
// Does NOT create the FME wrapper itself — that must be done in the Contentful
// Wingify app UI so variations sync to Wingify correctly.
//
// Usage: npm run setup:hero-ab

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ENV_FILE = resolve(process.cwd(), ".env.local");
const CMA = "https://api.contentful.com";

await loadEnv();

const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const spaceId = process.env.CONTENTFUL_SPACE_ID;
const environmentId = process.env.CONTENTFUL_ENVIRONMENT || "master";

if (!managementToken || !spaceId) {
  fail("CONTENTFUL_MANAGEMENT_TOKEN and CONTENTFUL_SPACE_ID are required in .env.local");
}

const envPath = `/spaces/${spaceId}/environments/${environmentId}`;
const locale = await getDefaultLocale();

console.log(`Using space ${spaceId}, environment "${environmentId}"\n`);

await allowWrapperOnPage();
await createHeroB();

console.log(`
Next steps in Contentful (required for Wingify sync):

1. Open Content → Home page entry.
2. In Sections, remove "Home - Hero".
3. Click + Add content → "VWO FME Wrapper".
4. Create a new feature flag named "Home Hero Content".
5. Set Default (Control) = the existing "Home - Hero" entry
   (heading: "Build pages your whole team can edit").
6. Add Variation → link "Home - Hero B"
   (heading: "Ship content experiments without redeploys").
7. Publish the wrapper and the Home page.

Then in Wingify:
8. Open the synced feature flag → Rules → create an A/B testing rule (50/50).
9. Enable the rule and the flag for your Dev environment.
10. Restart npm run dev and hard-refresh the homepage in two browsers.
`);

async function allowWrapperOnPage() {
  const path = `${envPath}/content_types/page`;
  const contentType = await cma("GET", path);
  const sections = contentType.fields.find((f) => f.id === "sections");
  if (!sections) fail("Page content type has no sections field");

  const allowed = sections.items?.validations?.[0]?.linkContentType ?? [];
  if (allowed.includes("variationFmeContainer")) {
    console.log("Page.sections already allows VWO FME Wrapper");
    return;
  }

  sections.items.validations = [
    {
      linkContentType: [...allowed, "variationFmeContainer"],
    },
  ];

  const saved = await cma("PUT", path, {
    name: contentType.name,
    description: contentType.description,
    displayField: contentType.displayField,
    fields: contentType.fields,
  }, { "X-Contentful-Version": contentType.sys.version });

  await cma("PUT", `${path}/published`, undefined, {
    "X-Contentful-Version": saved.sys.version,
  });
  console.log("Updated Page.sections to allow VWO FME Wrapper");
}

async function createHeroB() {
  const id = "sample-home-hero-b";
  const path = `${envPath}/entries/${id}`;
  if (await cma("GET", path, undefined, {}, { allow404: true })) {
    console.log(`Hero B already exists (${id})`);
    return;
  }

  const control = await cma("GET", `${envPath}/entries/sample-home-hero`, undefined, {}, { allow404: true });
  const image = control?.fields?.image?.[locale];

  const fields = {
    internalName: { [locale]: "Home - Hero B" },
    heading: { [locale]: "Ship content experiments without redeploys" },
    subheading: {
      [locale]:
        "Variation B — powered by Wingify Feature Management. Half your visitors see this hero instead of the original.",
    },
    ctaLabel: { [locale]: "See how it works" },
    ctaUrl: { [locale]: "/about" },
  };
  if (image) fields.image = { [locale]: image };

  const saved = await cma("PUT", path, { fields }, { "X-Contentful-Content-Type": "hero" });
  await cma("PUT", `${path}/published`, undefined, {
    "X-Contentful-Version": saved.sys.version,
  });
  console.log(`Created and published Hero B (${id})`);
}

async function getDefaultLocale() {
  const { items } = await cma("GET", `${envPath}/locales`);
  return (items.find((l) => l.default) ?? items[0]).code;
}

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
      throw new Error(`${method} ${path} failed (${response.status}): ${data?.message ?? text}`);
    }
    return data;
  }
  throw new Error(`${method} ${path} kept hitting the rate limit`);
}

async function loadEnv() {
  try {
    const contents = await readFile(ENV_FILE, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const i = trimmed.indexOf("=");
      if (i === -1) continue;
      const key = trimmed.slice(0, i);
      const value = trimmed.slice(i + 1);
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    fail(".env.local not found");
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}
