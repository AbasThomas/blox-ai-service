"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./spotlight-button.module.css";

type SpotlightButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function SpotlightButton({
  children,
  className,
  href,
  type = "button",
  onClick,
}: SpotlightButtonProps) {
  if (href) {
    return (
      <span className={cn(styles.wrapper, className)}>
        <Link href={href} className={styles.control}>
          <span aria-hidden className={styles.outlineFrame}>
            <span className={styles.outlineBeam} />
            <span className={styles.outlineCore} />
          </span>
          <span aria-hidden className={styles.surface}>
            <span className={styles.surfaceGradient} />
            <span className={styles.dots} />
            <span className={styles.innerGlow} />
          </span>
          <span className={styles.content}>
            <span className={styles.label}>{children}</span>
            <ArrowRight size={16} className={styles.arrow} />
          </span>
        </Link>
      </span>
    );
  }

  return (
    <span className={cn(styles.wrapper, className)}>
      <button type={type} className={styles.control} onClick={onClick}>
        <span aria-hidden className={styles.outlineFrame}>
          <span className={styles.outlineBeam} />
          <span className={styles.outlineCore} />
        </span>
        <span aria-hidden className={styles.surface}>
          <span className={styles.surfaceGradient} />
          <span className={styles.dots} />
          <span className={styles.innerGlow} />
        </span>
        <span className={styles.content}>
          <span className={styles.label}>{children}</span>
          <ArrowRight size={16} className={styles.arrow} />
        </span>
      </button>
    </span>
  );
}
