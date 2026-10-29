export function SetupNotice() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center px-6 py-20">
      <h1 className="text-3xl font-bold">Connect Contentful</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        This site reads its content from Contentful, but no Contentful tokens are set yet.
      </p>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-zinc-700 dark:text-zinc-300">
        <li>
          In Contentful, go to <strong>Settings → CMA tokens</strong> and create a personal access
          token.
        </li>
        <li>
          Paste it into <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.local</code>{" "}
          as <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">CONTENTFUL_MANAGEMENT_TOKEN</code>.
        </li>
        <li>
          Run <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">npm run setup</code>, then
          restart <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">npm run dev</code>.
        </li>
      </ol>
    </main>
  );
}
