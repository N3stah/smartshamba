interface ErrorStateProps {
  message?: string;
}

export default function ErrorState({ message = 'Something went wrong. Please try again later.' }: ErrorStateProps) {
  return (
    <div className="py-12 text-center text-red-500 text-sm bg-red-50 rounded-lg border border-red-100">
      {message}
    </div>
  );
}
