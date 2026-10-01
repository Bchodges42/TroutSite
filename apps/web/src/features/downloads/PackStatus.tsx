import type { DownloadManifestRecord } from '../../lib/db';
import { computePackReadiness } from '../../lib/downloadManifests';

/**
 * Per-section readiness for one manifest (ADR 0012 decision 3): every section
 * states what is on the device. A missing OPTIONAL section (terrain) reads
 * "optional — not downloaded" and never promotes or demotes the pack's own
 * readiness line: only required sections gate "ready".
 */
export function PackStatus({ manifest }: { manifest: DownloadManifestRecord }) {
  const readiness = computePackReadiness(manifest.sections);
  return (
    <div>
      <p
        className="text-sm font-bold"
        data-testid="pack-readiness"
        role="status"
        style={{
          color: readiness.requiredReady
            ? 'var(--trout-color-primary)'
            : !readiness.anyReady
              ? 'var(--trout-color-text-muted)'
              : 'var(--trout-status-fair)',
        }}
      >
        {!readiness.anyReady
          ? 'Nothing downloaded yet'
          : readiness.requiredReady
            ? readiness.partialOptional
              ? 'Ready offline — optional sections not downloaded'
              : 'Ready offline'
            : readiness.anyReady
              ? 'Partial — required sections missing'
              : 'Not ready'}
      </p>
      <ul className="mt-1 flex flex-col gap-1" aria-label={`Sections of ${manifest.label}`}>
        {manifest.sections.map((section) => (
          <li key={section.key} className="flex flex-wrap items-baseline gap-2 text-sm">
            <span aria-hidden="true">{section.ready ? '✓' : '·'}</span>
            <span className="min-w-0 flex-1">
              {section.label}
              {section.required ? '' : ' (optional)'}
            </span>
            <span
              className="text-xs font-semibold"
              style={{
                color: section.ready
                  ? 'var(--trout-color-primary)'
                  : section.required
                    ? 'var(--trout-status-fair)'
                    : 'var(--trout-color-text-muted)',
              }}
            >
              {section.ready
                ? 'On this device'
                : section.required
                  ? 'Not downloaded'
                  : 'Optional — not downloaded'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
