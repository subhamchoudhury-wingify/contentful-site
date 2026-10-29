import Image from "next/image";
import Link from "next/link";
import type {
  CallToActionSection,
  FeatureGridSection,
  HeroSection,
  Section,
  TestimonialSection,
} from "@/lib/contentful";

export function Sections({ sections }: { sections: Section[] }) {
  return sections.map((section) => {
    switch (section.type) {
      case "hero":
        return <Hero key={section.id} {...section} />;
      case "featureGrid":
        return <FeatureGrid key={section.id} {...section} />;
      case "testimonial":
        return <Testimonial key={section.id} {...section} />;
      case "callToAction":
        return <CallToAction key={section.id} {...section} />;
    }
  });
}

function Button({ href, label, variant }: { href: string; label: string; variant: "dark" | "light" }) {
  const className =
    variant === "dark"
      ? "inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      : "inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50";

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

function Hero({ heading, subheading, ctaLabel, ctaUrl, image }: HeroSection) {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
      <div className={image ? "" : "md:col-span-2 md:text-center"}>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">{heading}</h1>
        {subheading && (
          <p className="mt-6 text-lg leading-8 text-pretty text-zinc-600 dark:text-zinc-400">
            {subheading}
          </p>
        )}
        {ctaLabel && ctaUrl && (
          <div className="mt-8">
            <Button href={ctaUrl} label={ctaLabel} variant="dark" />
          </div>
        )}
      </div>
      {image && (
        <Image
          src={image.url}
          alt={image.title}
          width={image.width}
          height={image.height}
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
          className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
        />
      )}
    </section>
  );
}

function FeatureGrid({ heading, subheading, features }: FeatureGridSection) {
  return (
    <section className="bg-zinc-50 py-20 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-6">
        {(heading || subheading) && (
          <div className="mx-auto max-w-2xl text-center">
            {heading && <h2 className="text-3xl font-bold tracking-tight">{heading}</h2>}
            {subheading && (
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{subheading}</p>
            )}
          </div>
        )}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              {feature.icon && <div className="text-3xl">{feature.icon}</div>}
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              {feature.description && (
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">{feature.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonial({ quote, authorName, authorRole }: TestimonialSection) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 text-center">
      <blockquote className="text-2xl leading-relaxed font-medium text-balance">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <p className="mt-6 font-semibold">{authorName}</p>
      {authorRole && <p className="text-sm text-zinc-500">{authorRole}</p>}
    </section>
  );
}

function CallToAction({ heading, body, buttonLabel, buttonUrl }: CallToActionSection) {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-6xl rounded-3xl bg-indigo-600 px-6 py-16 text-center text-white">
        <h2 className="text-3xl font-bold tracking-tight">{heading}</h2>
        {body && <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">{body}</p>}
        {buttonLabel && buttonUrl && (
          <div className="mt-8">
            <Button href={buttonUrl} label={buttonLabel} variant="light" />
          </div>
        )}
      </div>
    </section>
  );
}
