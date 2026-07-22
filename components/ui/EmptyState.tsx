interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="py-12 text-center text-gray-400 text-sm">
      {message}
    </div>
  );
}
