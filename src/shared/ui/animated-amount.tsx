"use client";

import { m, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

import { useMotionTokens } from "@/shared/ui/motion-provider";

type AnimatedAmountProps = {
  value: number;
  animate: boolean;
  format: (value: number) => string;
  className?: string;
};

export function AnimatedAmount({ value, animate, format, className }: AnimatedAmountProps) {
  const tokens = useMotionTokens();
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, {
    stiffness: tokens.stiffness,
    damping: tokens.damping,
  });
  const display = useTransform(spring, (latest) => format(Math.round(latest)));

  useEffect(() => {
    if (animate) {
      motionValue.set(value);
    } else {
      motionValue.jump(value);
      spring.jump(value);
    }
  }, [value, animate, motionValue, spring]);

  return <m.span className={className}>{display}</m.span>;
}
