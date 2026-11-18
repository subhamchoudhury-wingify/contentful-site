import { cacheLife, cacheTag } from "next/cache";

export const CONTENTFUL_CACHE_TAG = "contentful";
export const FME_WRAPPER_TYPE = "variationFmeContainer";

export type ImageAsset = {
  url: string;
  title: string;
  width: number;
  height: number;
};

export type HeroSection = {
  type: "hero";
  id: string;
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  image?: ImageAsset;
};

export type FeatureGridSection = {
  type: "featureGrid";
  id: string;
  heading?: string;
  subheading?: string;
  features: { id: string; title: string; description?: string; icon?: string }[];
};

export type TestimonialSection = {
  type: "testimonial";
  id: string;
  quote: string;
  authorName: string;
  authorRole?: string;
};

export type CallToActionSection = {
  type: "callToAction";
  id: string;
  heading: string;
  body?: string;
  buttonLabel?: string;
  buttonUrl?: string;
};

export type Section =
  | HeroSection
  | FeatureGridSection
  | TestimonialSection
  | CallToActionSection;

/** Contentful VWO FME Wrapper — resolved at request time via the VWO SDK. */
export type FmeWrapperSection = {
  type: "fmeWrapper";
  id: string;
  title?: string;
  featureKey: string;
  /** Contentful entry id for the Default / Control variation. */
  defaultEntryId: string;
  meta: Record<string, string>;
};

export type PageSection = Section | FmeWrapperSection;

export type Page = {
  title: string;
  slug: string;
  seoDescription?: string;
  sections: PageSection[];
};

type Link = { sys: { type: "Link"; linkType: "Entry" | "Asset"; id: string } };
type RawEntry = {
  sys: { id: string; contentType: { sys: { id: string } } };
  fields: Record<string, unknown>;
};
type RawAsset = {
  sys: { id: string };
  fields: {
    title?: string;
    file?: { url: string; details?: { image?: { width: number; height: number } } };
  };
};
type EntriesResponse = {
  items: RawEntry[];
  includes?: { Entry?: RawEntry[]; Asset?: RawAsset[] };
};

type FeatureFlagPayload = {
  featureKey?: string;
  variables?: { variableName?: string; defaultValue?: string }[];
  variations?: {
    key?: string;
    name?: string;
    variables?: { variableId?: number; value?: string }[];
    jsonContent?: { variableId?: number; value?: string }[];
  }[];
};

const usePreview = process.env.CONTENTFUL_PREVIEW === "true";

export function isContentfulConfigured() {
  const token = usePreview
    ? process.env.CONTENTFUL_PREVIEW_TOKEN
    : process.env.CONTENTFUL_DELIVERY_TOKEN;
  return Boolean(process.env.CONTENTFUL_SPACE_ID && token);
}

async function fetchEntries(query: Record<string, string>): Promise<EntriesResponse> {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";
  const host = usePreview ? "preview.contentful.com" : "cdn.contentful.com";
  const token = usePreview
    ? process.env.CONTENTFUL_PREVIEW_TOKEN
    : process.env.CONTENTFUL_DELIVERY_TOKEN;

  const url = `https://${host}/spaces/${spaceId}/environments/${environment}/entries?${new URLSearchParams(query)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    throw new Error(`Contentful request failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

function buildResolvers(data: EntriesResponse) {
  const entries = new Map((data.includes?.Entry ?? []).map((e) => [e.sys.id, e]));
  for (const item of data.items) entries.set(item.sys.id, item);
  const assets = new Map((data.includes?.Asset ?? []).map((a) => [a.sys.id, a]));

  const resolveEntry = (link: unknown) => entries.get((link as Link | undefined)?.sys.id ?? "");
  const resolveImage = (link: unknown): ImageAsset | undefined => {
    const asset = assets.get((link as Link | undefined)?.sys.id ?? "");
    const file = asset?.fields.file;
    if (!file) return undefined;
    return {
      url: `https:${file.url}`,
      title: asset.fields.title ?? "",
      width: file.details?.image?.width ?? 1600,
      height: file.details?.image?.height ?? 900,
    };
  };

  return { entries, resolveEntry, resolveImage };
}

function defaultEntryIdFromFlag(
  flag: FeatureFlagPayload | undefined,
  meta: Record<string, string>,
  wrapperId: string,
): string {
  const fromVariable = flag?.variables?.find((v) => v.variableName === "vwoContentful")?.defaultValue;
  if (fromVariable && fromVariable !== wrapperId) return fromVariable;

  const defaultVariation = flag?.variations?.find(
    (v) => v.key === "default" || v.name?.toLowerCase() === "default",
  );
  const fromVariation =
    defaultVariation?.variables?.[0]?.value ?? defaultVariation?.jsonContent?.[0]?.value;
  if (fromVariation && fromVariation !== wrapperId) return fromVariation;

  if (meta["1"] && meta["1"] !== wrapperId) return meta["1"];
  return fromVariable || fromVariation || meta["1"] || wrapperId;
}

function toRenderableSection(
  entry: RawEntry,
  resolveEntry: (link: unknown) => RawEntry | undefined,
  resolveImage: (link: unknown) => ImageAsset | undefined,
): PageSection | null {
  const f = entry.fields as Record<string, never>;
  const id = entry.sys.id;

  switch (entry.sys.contentType.sys.id) {
    case "hero":
      return {
        type: "hero",
        id,
        heading: f.heading,
        subheading: f.subheading,
        ctaLabel: f.ctaLabel,
        ctaUrl: f.ctaUrl,
        image: resolveImage(f.image),
      };
    case "featureGrid":
      return {
        type: "featureGrid",
        id,
        heading: f.heading,
        subheading: f.subheading,
        features: ((f.features as unknown[] | undefined) ?? [])
          .map(resolveEntry)
          .filter((e): e is RawEntry => Boolean(e))
          .map((e) => ({
            id: e.sys.id,
            title: e.fields.title as string,
            description: e.fields.description as string | undefined,
            icon: e.fields.icon as string | undefined,
          })),
      };
    case "testimonial":
      return {
        type: "testimonial",
        id,
        quote: f.quote,
        authorName: f.authorName,
        authorRole: f.authorRole,
      };
    case "callToAction":
      return {
        type: "callToAction",
        id,
        heading: f.heading,
        body: f.body,
        buttonLabel: f.buttonLabel,
        buttonUrl: f.buttonUrl,
      };
    case FME_WRAPPER_TYPE: {
      const flag = f.featureFlag as FeatureFlagPayload | undefined;
      const meta = (f.meta as Record<string, string> | undefined) ?? {};
      const featureKey = flag?.featureKey;
      if (!featureKey) return null;
      return {
        type: "fmeWrapper",
        id,
        title: f.title,
        featureKey,
        defaultEntryId: defaultEntryIdFromFlag(flag, meta, id),
        meta,
      };
    }
    default:
      return null;
  }
}

export async function getPage(slug: string): Promise<Page | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CONTENTFUL_CACHE_TAG);

  if (!isContentfulConfigured()) return null;

  const data = await fetchEntries({
    content_type: "page",
    "fields.slug": slug,
    include: "3",
    limit: "1",
  });
  const page = data.items[0];
  if (!page) return null;

  const { resolveEntry, resolveImage } = buildResolvers(data);
  const fields = page.fields as Record<string, never>;

  return {
    title: fields.title,
    slug: fields.slug,
    seoDescription: fields.seoDescription,
    sections: ((fields.sections as unknown[] | undefined) ?? [])
      .map(resolveEntry)
      .filter((e): e is RawEntry => Boolean(e))
      .map((e) => toRenderableSection(e, resolveEntry, resolveImage))
      .filter((s): s is PageSection => Boolean(s)),
  };
}

export async function getSectionById(entryId: string): Promise<Section | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CONTENTFUL_CACHE_TAG);

  if (!isContentfulConfigured() || !entryId) return null;

  const data = await fetchEntries({
    "sys.id": entryId,
    include: "3",
    limit: "1",
  });
  const entry = data.items[0];
  if (!entry) return null;

  // Never render another wrapper as the winning variation.
  if (entry.sys.contentType.sys.id === FME_WRAPPER_TYPE) return null;

  const { resolveEntry, resolveImage } = buildResolvers(data);
  const section = toRenderableSection(entry, resolveEntry, resolveImage);
  return section && section.type !== "fmeWrapper" ? section : null;
}

export async function getPageSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CONTENTFUL_CACHE_TAG);

  if (!isContentfulConfigured()) return [];

  const data = await fetchEntries({ content_type: "page", select: "fields.slug", limit: "1000" });
  return data.items.map((item) => item.fields.slug as string);
}
