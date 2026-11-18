import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResolvedSections } from "@/components/resolved-sections";
import { SetupNotice } from "@/components/setup-notice";
import { getPage, isContentfulConfigured } from "@/lib/contentful";

const HOME_SLUG = "home";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(HOME_SLUG);
  return { description: page?.seoDescription };
}

export default async function HomePage() {
  if (!isContentfulConfigured()) return <SetupNotice />;

  const page = await getPage(HOME_SLUG);
  if (!page) notFound();

  return (
    <main className="flex-1">
      <ResolvedSections sections={page.sections} />
    </main>
  );
}
