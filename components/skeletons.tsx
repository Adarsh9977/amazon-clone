// Shimmer placeholders (F12).

const shimmer = "animate-pulse rounded bg-[#e9ecec]";

export function ResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading results">
      <div className="h-[46px] border-b border-[#ddd] bg-white" />
      <div className="mx-auto flex max-w-[1500px] gap-6 px-3 pt-3 md:px-5">
        <div className="hidden w-[220px] shrink-0 space-y-3 lg:block">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className={`${shimmer} h-4`} style={{ width: `${50 + ((i * 37) % 45)}%` }} />
          ))}
        </div>
        <ul className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="space-y-2 rounded-sm border border-[#eee] p-3">
              <div className={`${shimmer} aspect-square`} />
              <div className={`${shimmer} h-4`} />
              <div className={`${shimmer} h-4 w-2/3`} />
              <div className={`${shimmer} h-6 w-1/3`} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product" className="mx-auto grid max-w-[1500px] gap-6 px-4 py-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_244px]">
      <div className={`${shimmer} aspect-square`} />
      <div className="space-y-3">
        <div className={`${shimmer} h-7`} />
        <div className={`${shimmer} h-7 w-3/4`} />
        <div className={`${shimmer} h-4 w-1/3`} />
        <div className={`${shimmer} h-10 w-1/2`} />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`${shimmer} h-4`} />
        ))}
      </div>
      <div className={`${shimmer} h-[360px]`} />
    </div>
  );
}
