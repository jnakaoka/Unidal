"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

type ContentProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
  className?: string;
};

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  ContentProps
>(({ className, align = "center", sideOffset = 8, ...props }, ref) => {
  const classes = [
    "z-[12000]",
    "w-96",
    "rounded-xl",
    "border",
    "bg-white",
    "p-4",
    "shadow-xl",
    "outline-none",
    "data-[state=open]:animate-in",
    "data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0",
    "data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95",
    "data-[state=open]:zoom-in-95",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={classes}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = "PopoverContent";
