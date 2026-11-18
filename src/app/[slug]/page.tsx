import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ResolvedSections } from "@/components/resolved-sections";
import { getPage, getPageSlugs } from "@/lib/contentful";

export async function generateStaticParams() {
  const slugs = (await getPageSlugs()).filter((slug) => slug !== "home");
  // Cache Components requires at least one param; unknown slugs render notFound().
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "about" }];
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  return { title: page?.title, description: page?.seoDescription };
}

export default function SlugPage({ params }: PageProps<"/[slug]">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<div className="mx-auto h-96 max-w-6xl animate-pulse px-6 py-20" />}>
        <PageContent params={params} />
      </Suspense>
    </main>
  );
}

async function PageContent({ params }: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return <ResolvedSections sections={page.sections} />;
}
