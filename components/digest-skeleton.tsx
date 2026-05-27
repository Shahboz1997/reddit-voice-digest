export function DigestSkeleton() {
  return (
    <div className="app-shell mx-auto flex min-h-screen w-full max-w-[1600px] gap-3 px-3 py-4 sm:gap-4 sm:px-4 lg:px-6 lg:py-5">
      <div className="flex min-w-0 flex-1 flex-col space-y-4">
        <div className="skeleton h-4 w-32" />
        <section className="spotify-panel p-6 sm:p-8">
          <div className="skeleton h-8 w-full max-w-xl" />
          <div className="skeleton mt-3 h-4 w-full max-w-2xl" />
          <div className="mt-6 flex gap-4">
            <div className="skeleton h-36 w-36 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton h-7 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </section>
        <section className="spotify-panel p-5">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="skeleton h-12 w-full rounded-md" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
