import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    showLabel?: boolean;
  }
>(({ className, showLabel, ...props }, ref) => (
  <div className="inline-flex items-center gap-2">
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-all duration-300 ease-in-out",
        "data-[state=checked]:bg-emerald-500 data-[state=checked]:shadow-[0_0_10px_rgba(16,185,129,0.4)]",
        "data-[state=unchecked]:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:data-[state=unchecked]:bg-muted-foreground/30 hover:data-[state=checked]:bg-emerald-400",
        className,
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0",
          "transition-transform duration-300 ease-in-out",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitives.Root>
    {showLabel && (
      <span
        className={cn(
          "text-xs font-medium transition-colors duration-200 select-none",
          props.checked ? "text-emerald-600" : "text-muted-foreground",
        )}
      >
        {props.checked ? "مفعل ✅" : "غير مفعل ❌"}
      </span>
    )}
  </div>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
