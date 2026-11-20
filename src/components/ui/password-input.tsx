"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  className?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="relative flex w-full items-center">
        <input
          type={showPassword ? "text" : "password"}
          className={cn(
            "border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:bg-background h-9 w-full rounded-xl border pr-10 pl-3 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          tabIndex={0}
          className="text-muted-foreground hover:text-foreground absolute right-2.5 flex h-6 w-6 items-center justify-center rounded-md transition-colors focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
