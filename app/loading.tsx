export default function Loading() {
  return (
    <div className="py-4 space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-10 w-64 bg-muted rounded-md"></div>
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-muted rounded-md"></div>
          <div className="h-10 w-32 bg-muted rounded-md"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-xl"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-4/3 bg-muted rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}
