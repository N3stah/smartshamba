interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      {action}
    </div>
  );
}
