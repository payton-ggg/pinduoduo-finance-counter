export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-md mb-6"></div>
      <div className="space-y-6">
        <div className="h-96 bg-muted rounded-xl w-full"></div>
      </div>
    </div>
  );
}
