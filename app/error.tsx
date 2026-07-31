'use client';
import ErrorUI from './ErrorUI';

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorUI error={error} reset={reset} title="Application Error" />;
}
