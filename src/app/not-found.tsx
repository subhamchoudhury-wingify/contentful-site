import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col justify-center px-6 py-20 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        If you just created this page, check that a <strong>Page</strong> entry with this slug is
        published in Contentful.
      </p>
      <Link href="/" className="mt-8 font-semibold text-indigo-600 hover:underline">
        Go to the homepage
      </Link>
    </main>
  );
}
