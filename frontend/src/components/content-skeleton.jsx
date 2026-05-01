import { Skeleton } from "@/components/ui/skeleton";

function ContentSkeleton({ cards = 3, detail = true }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-72 max-w-[85vw]" />
          <Skeleton className="h-5 w-[32rem] max-w-[90vw]" />
        </div>
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-[24px]" />
        ))}
      </div>

      {detail ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Skeleton className="h-[320px] w-full rounded-[28px]" />
          <Skeleton className="h-[320px] w-full rounded-[28px]" />
        </div>
      ) : null}
    </div>
  );
}

export default ContentSkeleton;
