import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-public-primary text-white hover:bg-public-primary/90 focus-visible:ring-public-primary",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400",
      outline: "border border-border bg-transparent text-text hover:bg-gray-50 focus-visible:ring-gray-400",
      ghost: "bg-transparent text-text hover:bg-gray-100 focus-visible:ring-gray-400",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
    };

    const sizes = {
      sm: "h-9 px-3 rounded-md text-sm",
      md: "h-11 px-5 rounded-md text-sm",
      lg: "h-12 px-6 rounded-md text-base",
    };

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
