import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xl border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-emerald-500 text-white",
        gold: "border-transparent bg-amber-500 text-white",
        secondary: "border-transparent bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
        outline: "border-emerald-200 text-emerald-800 dark:border-emerald-800 dark:text-emerald-100",
        verified: "border-transparent bg-sky-500 text-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
