'use client';
import ErrorUI from './ErrorUI';

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorUI error={error} reset={reset} title="Admin Dashboard Error" />;
}
