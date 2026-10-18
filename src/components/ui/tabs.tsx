"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const TabValue = React.createContext<string | undefined>(undefined);

function Tabs({
  className,
  orientation = "horizontal",
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [internal, setInternal] = React.useState(defaultValue);
  const selected = value ?? internal;
  const id = React.useId();
  return (
    <TabValue.Provider value={selected}>
      <LayoutGroup id={id}>
        <TabsPrimitive.Root
          data-slot="tabs"
          data-orientation={orientation}
          orientation={orientation}
          value={selected}
          onValueChange={(next) => {
            setInternal(next);
            onValueChange?.(next);
          }}
          className={cn(
            "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
            className,
          )}
          {...props}
        >
          {children}
        </TabsPrimitive.Root>
      </LayoutGroup>
    </TabValue.Provider>
  );
}
const tabsListVariants = cva("tabs-list", {
  variants: { variant: { default: "tabs-segmented", line: "tabs-line" } },
  defaultVariants: { variant: "default" },
});
function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}
function TabsTrigger({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const selected = React.useContext(TabValue);
  const reduced = useReducedMotion();
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      className={cn("tab-trigger", className)}
      {...props}
    >
      {selected === value && (
        <motion.span
          layoutId="tab-indicator"
          className="tab-indicator"
          aria-hidden="true"
          transition={{ duration: reduced ? 0 : 0.16, ease: [0.2, 0, 0, 1] }}
        />
      )}
      <span className="tab-label">{children}</span>
    </TabsPrimitive.Trigger>
  );
}
function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("min-w-0 flex-1 outline-none", className)}
      {...props}
    />
  );
}
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
