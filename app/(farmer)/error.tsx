'use client';
import ErrorUI from './ErrorUI';

export default function FarmerError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorUI error={error} reset={reset} title="Farmer Dashboard Error" />;
}
