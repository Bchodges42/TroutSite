import type { SVGProps } from 'react';

/** Tiny inline stroke-icon set (24px grid) — no icon library, no extra bytes. */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></> });
}

export function BugIcon(props: IconProps) {
  return base({ ...props, children: <><circle cx="12" cy="13" r="5" /><path d="M12 8V5M8 5l2 3M16 5l-2 3" /><path d="M7 13H3M21 13h-4M7.5 17l-3 2.5M16.5 17l3 2.5M7.5 9.5 4.5 7M16.5 9.5l3-2.5" /></> });
}

export function ChartIcon(props: IconProps) {
  return base({ ...props, children: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 15v-3M12 15V8M17 15v-5" /></> });
}

export function WavesIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M2 7c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" /><path d="M2 12c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" /><path d="M2 17c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" /></> });
}

export function FishIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M2 12s3.5-5 8-5c3 0 5.5 2 7 5-1.5 3-4 5-7 5-4.5 0-8-5-8-5Z" /><path d="M17 12c2 0 3.5-1.5 5-3-1 3-1 3 0 6-1.5-1.5-3-3-5-3" /><circle cx="7" cy="11" r="0.6" fill="currentColor" /></> });
}

export function ShopIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M4 8h16l-1.5 12a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1L4 8Z" /><path d="M8.5 11V7a3.5 3.5 0 0 1 7 0v4" /></> });
}

export function BookIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" /></> });
}

export function GearIcon(props: IconProps) {
  return base({ ...props, children: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.2 2.2M16.8 16.8 19 19M19 5l-2.2 2.2M7.2 16.8 5 19" /></> });
}

export function ShieldIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></> });
}

export function MenuIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M4 7h16M4 12h16M4 17h16" /></> });
}

export function CloseIcon(props: IconProps) {
  return base({ ...props, children: <><path d="m6 6 12 12M18 6 6 18" /></> });
}

export function LocationIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M12 21s-6.5-5.5-6.5-10.5A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.5C18.5 15.5 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.2" /></> });
}

export function DownloadIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M12 3v12M7 11l5 5 5-5" /><path d="M4 20h16" /></> });
}

export function UploadIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M12 15V3M7 7l5-5 5 5" /><path d="M4 20h16" /></> });
}

export function WifiOffIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M2 4 22 20" /><path d="M5 12.5a10 10 0 0 1 5.5-3M2 8a15 15 0 0 1 4-2.4M19.5 15a10 10 0 0 0-2.6-2.4" /><circle cx="12" cy="19" r="0.8" fill="currentColor" /></> });
}

export function SlidersIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M4 8h10M18 8h2M4 16h4M12 16h8" /><circle cx="16" cy="8" r="2.2" /><circle cx="10" cy="16" r="2.2" /></> });
}

export function LayersIcon(props: IconProps) {
  return base({ ...props, children: <><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" /><path d="m4 12.5 8 4.5 8-4.5" /><path d="m4 17 8 4.5L20 17" /></> });
}

export function ListIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="0.8" fill="currentColor" /><circle cx="4" cy="12" r="0.8" fill="currentColor" /><circle cx="4" cy="18" r="0.8" fill="currentColor" /></> });
}

export function CalendarIcon(props: IconProps) {
  return base({ ...props, children: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></> });
}
