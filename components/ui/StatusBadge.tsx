interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SETTLED:   'bg-green-100 text-green-800',
  DISPUTED:  'bg-red-100 text-red-800',
  DELIVERED: 'bg-purple-100 text-purple-800',
  OPEN:      'bg-red-100 text-red-800',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  RESOLVED:  'bg-green-100 text-green-800',
  CLOSED:    'bg-gray-100 text-gray-800',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
