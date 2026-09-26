import * as React from "react";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-lg border border-border bg-surface ${className}`}
      {...props}
    />
  )
);
Card.displayName = "Card";
