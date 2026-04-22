export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-64 bg-muted rounded-md"></div>
        <div className="h-10 w-24 bg-muted rounded-md"></div>
      </div>
      <div className="space-y-6">
        <div className="h-64 bg-muted rounded-xl w-full"></div>
        <div className="h-32 bg-muted rounded-xl w-full"></div>
        <div className="h-32 bg-muted rounded-xl w-full"></div>
      </div>
    </div>
  );
}
