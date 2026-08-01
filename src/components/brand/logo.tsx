import { cn } from "@/lib/utils";

/**
 * Bildmarke: gerundetes Quadrat mit Balkendiagramm, unten rechts überlagert von
 * einer Euro-Münze. Die Münze ist per Maske aus Rahmen und Balken ausgestanzt,
 * damit sie auf jedem Hintergrund freisteht — auch im Dunkelmodus.
 *
 * Die IDs sind pro Instanz eindeutig, weil mehrere Logos auf einer Seite sonst
 * denselben Verlauf referenzieren und der zweite Treffer gewinnt.
 */
export function LogoMark({
  className,
  id = "fd",
}: {
  className?: string;
  id?: string;
}) {
  const gradientId = `${id}-gradient`;
  const maskId = `${id}-mask`;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cn("size-8", className)}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="6"
          y1="6"
          x2="42"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#60A5FA" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <mask id={maskId}>
          <rect width="48" height="48" fill="#fff" />
          <circle cx="35.5" cy="35.5" r="11.6" fill="#000" />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        <rect
          x="6.7"
          y="6.7"
          width="30.6"
          height="30.6"
          rx="8.4"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.1"
        />
        <rect x="13.2" y="23.6" width="5.2" height="9.6" rx="2.2" fill="#93C5FD" />
        <rect x="21.4" y="18.6" width="5.2" height="14.6" rx="2.2" fill="#3B82F6" />
        <rect x="29.6" y="13.2" width="5.2" height="20" rx="2.2" fill="#2563EB" />
      </g>

      <circle
        cx="35.5"
        cy="35.5"
        r="8.3"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
      />
      <g
        stroke="#2563EB"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="dark:stroke-[#60A5FA]"
      >
        <path d="M38.3 32.4a3.9 3.9 0 1 0 0 6.2" />
        <path d="M31.6 34.6h5.5" />
        <path d="M31.6 36.7h4.8" />
      </g>
    </svg>
  );
}

/** Bildmarke plus Wortmarke — für Sidebar, Topbar und Anmeldeseiten. */
export function Logo({
  className,
  markClassName,
  id,
}: {
  className?: string;
  markClassName?: string;
  id?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark id={id} className={markClassName} />
      <span className="font-semibold tracking-tight">
        Finance<span className="text-primary">Dash</span>
      </span>
    </span>
  );
}
