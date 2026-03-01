"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import styles from "./grid-shine-button.module.css";

type GridShineButtonProps = {
  children: React.ReactNode;
  href: string;
  className?: string;
};

export function GridShineButton({ children, href, className }: GridShineButtonProps) {
  return (
    <Link href={href} className={cn(styles.button, className)}>
      <span className={styles.edgeLeft} aria-hidden>
        <span className={styles.edgeSoft} />
        <span className={styles.edgeHover} />
      </span>
      <span className={styles.edgeRight} aria-hidden>
        <span className={styles.edgeSoft} />
        <span className={styles.edgeHover} />
      </span>
      <span className={styles.edgeTop} aria-hidden>
        <span className={styles.edgeSoft} />
        <span className={styles.edgeHover} />
      </span>
      <span className={styles.edgeBottom} aria-hidden>
        <span className={styles.edgeSoft} />
        <span className={styles.edgeHover} />
      </span>
      <span className={styles.overlay} aria-hidden />
      <span className={styles.radialGlow} aria-hidden />
      <span className={styles.label}>{children}</span>
    </Link>
  );
}
