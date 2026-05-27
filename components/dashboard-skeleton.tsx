export function DashboardSkeleton() {
  return (
    <div className="app-shell mx-auto flex min-h-screen w-full max-w-[1600px] gap-3 px-3 py-4 sm:gap-4 sm:px-4 lg:px-6 lg:py-5">
      <aside className="app-icon-rail hidden w-20 shrink-0 sm:flex">
        <div className="skeleton h-12 w-12 rounded-2xl" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-4 flex justify-end">
          <div className="skeleton h-10 w-28 rounded-full" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <section className="spotify-panel overflow-hidden p-6 sm:p-8">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton mt-3 h-10 w-40" />
              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <div className="skeleton h-40 w-40 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-7 w-full max-w-md" />
                  <div className="skeleton h-4 w-full max-w-lg" />
                  <div className="flex gap-2">
                    <div className="skeleton h-10 w-24 rounded-full" />
                    <div className="skeleton h-10 w-28 rounded-full" />
                  </div>
                </div>
              </div>
            </section>

            <section className="spotify-panel p-5 sm:p-6">
              <div className="skeleton h-6 w-36" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="skeleton h-14 w-full rounded-md" />
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="spotify-panel p-5">
              <div className="skeleton h-6 w-24" />
              <div className="skeleton mt-4 h-10 w-full rounded-md" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="skeleton h-16 w-full rounded-md" />
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
