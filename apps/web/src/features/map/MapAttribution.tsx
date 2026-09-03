import { atlas } from './mapTokens';

export function MapAttribution() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border bg-white/90 px-2.5 py-1 text-[10px] leading-none shadow-sm backdrop-blur"
      style={{ borderColor: atlas.hairline, color: atlas.softInk }}
      aria-label="Map attribution"
    >
      <span className="font-semibold tracking-wide text-[#24352D]">Field Notes Atlas</span>
      <span aria-hidden>·</span>
      <span>Streams © TWRA · Flows © USGS Water Data</span>
      <span aria-hidden>·</span>
      <a href="https://www.tn.gov/twra/fishing/trout-information-stockings.html" target="_blank" rel="noreferrer" className="underline hover:text-[#24352D]">
        Stockings
      </a>
      <span aria-hidden>·</span>
      <span>Boundary: TN GIS</span>
      <span aria-hidden>·</span>
      <span className="hidden sm:inline">No tracking · Offline-first · Data on this device only</span>
    </div>
  );
}
