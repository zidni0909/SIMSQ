import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = 'Tidak ada data',
  description = 'Belum ada data yang tersedia.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <InboxIcon size={48} className="text-secondary-300 mb-4" />
      <h3 className="text-lg font-medium text-secondary-700">{title}</h3>
      <p className="text-sm text-secondary-500 mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
