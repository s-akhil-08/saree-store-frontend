export function Skeleton({ className = ' ' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-stone/60 dark:bg-stone/20 rounded ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col w-full bg-paper p-[16px] relative h-full">
      <div className="w-full aspect-[3/4] bg-stone rounded-md overflow-hidden relative mb-[16px]">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="flex flex-col flex-1 space-y-2">
        <Skeleton className="h-[20px] w-[80%] rounded" />
        <Skeleton className="h-[12px] w-[35%] rounded mb-1" />
        <Skeleton className="h-[14px] w-[95%] rounded" />
        <Skeleton className="h-[14px] w-[65%] rounded" />
      </div>
      <div className="mt-auto pt-[16px] flex gap-[8px] relative z-10">
        <Skeleton className="h-[34px] flex-1 rounded" />
        <Skeleton className="h-[34px] w-[36px] rounded" />
      </div>
    </div>
  );
}

export function CategoryTileSkeleton() {
  return (
    <div className="w-[80vw] md:w-[320px] lg:w-[400px] shrink-0">
      <Skeleton className="w-full aspect-[3/4] rounded-lg mb-[12px]" />
      <Skeleton className="h-[16px] w-[50%] mx-auto rounded" />
    </div>
  );
}

export function ProductsPageSkeleton() {
  return (
    <div className="container-custom py-[32px] md:py-[48px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-[16px] border-y border-smoke mb-[32px]">
        <Skeleton className="h-[20px] w-[180px] rounded" />
        <div className="flex gap-3">
          <Skeleton className="h-[36px] w-[130px] rounded-md" />
          <Skeleton className="h-[36px] w-[130px] rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[16px] md:gap-[24px]">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ProductDetailsSkeleton() {
  return (
    <div className="container-custom py-[48px]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[48px] lg:gap-[64px]">
        {/* Gallery Skeleton */}
        <div className="w-full flex flex-col-reverse md:flex-row gap-[16px] items-center md:items-start justify-center">
          <div className="flex md:flex-col gap-[10px] overflow-x-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-[60px] h-[75px] sm:w-[68px] sm:h-[86px] rounded-lg shrink-0" />
            ))}
          </div>
          <div className="w-full max-w-[380px] aspect-[3/4] rounded-xl shrink-0">
            <Skeleton className="w-full h-full rounded-xl" />
          </div>
        </div>

        {/* Details Skeleton */}
        <div className="w-full flex flex-col space-y-6 pt-[16px]">
          <Skeleton className="h-[14px] w-[30%] rounded" />
          <Skeleton className="h-[38px] w-[80%] rounded" />
          <div className="flex gap-[12px] pt-2">
            <Skeleton className="h-[34px] w-[90px] rounded-full" />
            <Skeleton className="h-[34px] w-[90px] rounded-full" />
            <Skeleton className="h-[34px] w-[90px] rounded-full" />
          </div>
          <div className="space-y-2 pt-4">
            <Skeleton className="h-[14px] w-[100%] rounded" />
            <Skeleton className="h-[14px] w-[95%] rounded" />
            <Skeleton className="h-[14px] w-[70%] rounded" />
          </div>
          <div className="pt-4 flex gap-[12px]">
            <Skeleton className="h-[48px] flex-1 rounded" />
            <Skeleton className="h-[48px] w-[48px] rounded" />
          </div>
        </div>
      </div>

      {/* You May Also Like Recommendations Skeleton Section */}
      <div className="pt-[48px] border-t border-smoke mt-[48px]">
        <div className="flex justify-between items-end mb-[24px]">
          <div>
            <Skeleton className="h-[28px] w-[200px] rounded mb-3" />
            <div className="flex gap-3">
              <Skeleton className="h-[16px] w-[80px] rounded" />
              <Skeleton className="h-[16px] w-[110px] rounded" />
              <Skeleton className="h-[16px] w-[90px] rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-[36px] h-[36px] rounded-full" />
            <Skeleton className="w-[36px] h-[36px] rounded-full" />
          </div>
        </div>
        <div className="flex gap-[20px] md:gap-[24px] overflow-hidden py-[8px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[72vw] max-w-[260px] sm:max-w-none sm:w-[280px] md:w-[300px] shrink-0">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="container-custom py-[48px]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[32px]">
        <div className="space-y-3">
          <Skeleton className="h-[44px] w-full rounded-lg" />
          <Skeleton className="h-[44px] w-full rounded-lg" />
          <Skeleton className="h-[44px] w-full rounded-lg" />
        </div>
        <div className="md:col-span-3 space-y-6 p-6 border border-smoke/60 rounded-xl">
          <Skeleton className="h-[24px] w-[35%] rounded" />
          <div className="space-y-4 pt-2">
            <Skeleton className="h-[52px] w-full rounded-lg" />
            <Skeleton className="h-[52px] w-full rounded-lg" />
            <Skeleton className="h-[52px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConsultationListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 border border-smoke/60 rounded-lg space-y-3">
          <Skeleton className="h-[18px] w-[50%] rounded" />
          <Skeleton className="h-[14px] w-[30%] rounded" />
          <Skeleton className="h-[14px] w-[70%] rounded" />
        </div>
      ))}
    </div>
  );
}

export function ShowcaseSectionSkeleton() {
  return (
    <section className="container-custom py-[48px] border-t border-smoke">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px] md:gap-[48px] items-center">
        {/* Image Skeleton */}
        <div className="w-full aspect-[4/3] rounded-[20px] overflow-hidden">
          <Skeleton className="w-full h-full rounded-[20px]" />
        </div>

        {/* Text Details Skeleton */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left px-[16px] lg:px-[24px]">
          <Skeleton className="h-[32px] sm:h-[40px] w-[75%] rounded mb-[20px]" />
          <div className="w-full space-y-3 mb-[28px] max-w-lg">
            <Skeleton className="h-[14px] w-[100%] rounded" />
            <Skeleton className="h-[14px] w-[95%] rounded" />
            <Skeleton className="h-[14px] w-[88%] rounded" />
            <Skeleton className="h-[14px] w-[60%] rounded" />
          </div>
          <Skeleton className="h-[20px] w-[160px] rounded" />
        </div>
      </div>
    </section>
  );
}

