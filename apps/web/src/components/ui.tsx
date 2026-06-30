import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";

export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "mint" | "sun" | "coral" | "gray" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function ButtonLink({ href, children, variant = "primary", className = "" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "quiet"; className?: string }) {
  return <Link className={`button button-${variant} ${className}`} href={href}>{children}</Link>;
}

export function SectionHeading({ eyebrow, title, description, actionHref, actionLabel }: { eyebrow?: string; title: string; description?: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link className="text-link" href={actionHref}>{actionLabel}<ArrowRightIcon /></Link>
      ) : null}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className="progress-wrap" aria-label={label ?? `完成 ${safeValue}%`}>
      <div className="progress-track"><span style={{ width: `${safeValue}%` }} /></div>
      {label ? <span className="progress-label">{label}</span> : null}
    </div>
  );
}
