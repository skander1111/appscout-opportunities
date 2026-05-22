"use client";

interface Props {
  href: string;
  label: string;
  className?: string;
}

export default function BuyButton({ href, label, className }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full block text-center font-semibold py-3.5 rounded-xl text-sm transition-all ${className}`}
    >
      {label}
    </a>
  );
}
