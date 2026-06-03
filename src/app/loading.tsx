export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-zinc-800" />
        <div className="h-12 w-full max-w-md animate-pulse rounded-lg bg-zinc-800 sm:w-72" />
      </div>

      <section className="rounded-lg border border-zinc-800 bg-[#111315] p-6">
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-700" />
        <div className="mt-4 h-8 w-full max-w-xl animate-pulse rounded bg-zinc-800" />
        <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-zinc-800" />
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-lg bg-zinc-900" />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {[0, 1].map((item) => (
          <section
            key={item}
            className="min-h-64 rounded-lg border border-zinc-800 bg-[#151719] p-5"
          >
            <div className="h-6 w-44 animate-pulse rounded bg-zinc-800" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="h-24 animate-pulse rounded-lg bg-zinc-900" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
