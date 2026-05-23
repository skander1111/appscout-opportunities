"use client";

import { CSSProperties } from "react";

interface Props {
  href: string;
  label: string;
  className?: string;
  style?: CSSProperties;
}

export default function BuyButton({ href, label, className, style }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full block text-center font-semibold py-3.5 rounded-xl text-sm transition-all ${className}`}
      style={style}
    >
      {label}
    </a>
  );
}
