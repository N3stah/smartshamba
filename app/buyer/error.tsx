'use client';
import ErrorUI from './ErrorUI';

export default function BuyerError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorUI error={error} reset={reset} title="Buyer Portal Error" />;
}
