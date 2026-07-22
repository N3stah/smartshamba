import SkeletonCard from '@/components/ui/SkeletonCard';

export default function Loading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-96 animate-pulse"></div>
    </div>
  );
}
