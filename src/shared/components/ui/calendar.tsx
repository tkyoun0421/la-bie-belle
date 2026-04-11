"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { buttonVariants } from "#/shared/components/ui/button";
import { cn } from "#/shared/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  ...props
}: Readonly<CalendarProps>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      className={cn("w-full p-3", className)}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: "flex w-full flex-col gap-4 sm:flex-row",
        month: "w-full space-y-4",
        month_caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "flex items-center gap-2",
        button_previous: cn(
          buttonVariants({ size: "icon-sm", variant: "outline" }),
          "absolute left-0 size-8 rounded-full bg-background/90"
        ),
        button_next: cn(
          buttonVariants({ size: "icon-sm", variant: "outline" }),
          "absolute right-0 size-8 rounded-full bg-background/90"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "grid grid-cols-7 gap-1",
        weekday:
          "flex h-9 items-center justify-center text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground",
        week: "mt-1 grid grid-cols-7 gap-1",
        day: cn(
          defaultClassNames.day,
          "relative flex size-11 items-center justify-center p-0 text-sm"
        ),
        day_button: cn(
          buttonVariants({ size: "icon-sm", variant: "ghost" }),
          "size-11 rounded-2xl p-0 font-medium text-foreground aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground"
        ),
        selected: cn(
          defaultClassNames.selected,
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        ),
        today: cn(
          defaultClassNames.today,
          "bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)]",
        ),
        outside: cn(defaultClassNames.outside, "text-muted-foreground/40 opacity-100"),
        disabled: cn(
          defaultClassNames.disabled,
          "cursor-not-allowed text-muted-foreground/40 opacity-50"
        ),
        hidden: cn(defaultClassNames.hidden, "invisible"),
        ...classNames,
      }}
      components={{
        Chevron: ({ className: iconClassName, orientation, ...iconProps }) =>
          orientation === "left" ? (
            <ChevronLeft
              className={cn("size-4", iconClassName)}
              {...iconProps}
            />
          ) : (
            <ChevronRight
              className={cn("size-4", iconClassName)}
              {...iconProps}
            />
          ),
        ...components,
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  );
}
