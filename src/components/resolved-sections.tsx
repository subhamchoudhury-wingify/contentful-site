import { Suspense } from "react";
import { Sections } from "@/components/sections";
import {
  getSectionById,
  type FmeWrapperSection,
  type PageSection,
  type Section,
} from "@/lib/contentful";
import { getVisitorId } from "@/lib/visitor";
import { resolveContentfulEntryId } from "@/lib/vwo";

function isWrapper(section: PageSection): section is FmeWrapperSection {
  return section.type === "fmeWrapper";
}

function Skeleton() {
  return <div className="mx-auto h-96 max-w-6xl animate-pulse px-6 py-20" />;
}

/** Static sections render immediately; FME wrappers resolve per visitor inside Suspense. */
export function ResolvedSections({ sections }: { sections: PageSection[] }) {
  if (!sections.some(isWrapper)) {
    return <Sections sections={sections as Section[]} />;
  }

  return (
    <Suspense fallback={<Skeleton />}>
      <ResolveFmeSections sections={sections} />
    </Suspense>
  );
}

async function ResolveFmeSections({ sections }: { sections: PageSection[] }) {
  const visitorId = await getVisitorId();
  const resolved: Section[] = [];

  for (const section of sections) {
    if (!isWrapper(section)) {
      resolved.push(section);
      continue;
    }

    const entryId = await resolveContentfulEntryId(
      section.featureKey,
      visitorId,
      section.defaultEntryId,
    );
    const variation =
      (await getSectionById(entryId)) ?? (await getSectionById(section.defaultEntryId));

    if (variation) resolved.push(variation);
  }

  return <Sections sections={resolved} />;
}
