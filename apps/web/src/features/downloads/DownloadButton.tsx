import { Button, ConfirmButton } from '@trout/ui';
import type { DownloadManifestRecord } from '../../lib/db';
import { computePackReadiness } from '../../lib/downloadManifests';
import type { PinProgress } from '../../lib/packCache';

export interface DownloadButtonProps {
  /** Present once the pack has a manifest (downloaded or partially so). */
  manifest?: DownloadManifestRecord | undefined;
  /** A pin/verify/remove for this pack is in flight. */
  busy?: boolean;
  /** Live pin progress while busy (per section). */
  progress?: PinProgress | null | undefined;
  /** Honest connectivity: pinning needs the network, verifying does not. */
  offline: boolean;
  onDownload: () => void;
  onVerify?: () => void;
  onRemove?: () => void;
  /** Offered when a manifest exists but is NOT required-ready (evicted or
   *  failed sections): re-pins the pack from the network. */
  onRedownload?: () => void;
  /** Removes the ConfirmButton in tight rows (cards use their own actions). */
  confirmRemove?: boolean;
  className?: string;
}

/**
 * The download control's honest states (ADR 0012): idle → per-section
 * progress → ready / partial. While offline the download button is disabled
 * and says why — pinning fetches from the network; no pretending. A pack
 * whose optional terrain is missing reads "Ready offline — optional sections
 * not downloaded", never plain "ready".
 */
export function DownloadButton({
  manifest,
  busy = false,
  progress,
  offline,
  onDownload,
  onVerify,
  onRemove,
  onRedownload,
  confirmRemove = true,
  className,
}: DownloadButtonProps) {
  const readiness = manifest ? computePackReadiness(manifest.sections) : null;

  return (
    <span className={'inline-flex flex-wrap items-center gap-2 ' + (className ?? '')}>
      {!manifest && !busy && (
        <Button
          size="sm"
          data-testid="pack-download"
          className="focus-ring"
          disabled={offline}
          title={offline ? 'Pinning needs a network connection — you are offline right now.' : undefined}
          onClick={onDownload}
        >
          Download
        </Button>
      )}

      {busy && (
        <span className="text-sm font-semibold" role="status" data-testid="pack-busy">
          {progress
            ? `Downloading — ${progress.label} (${progress.done}/${progress.total})`
            : 'Working…'}
        </span>
      )}

      {manifest && !busy && readiness && (
        <>
          <span
            className="text-sm font-bold"
            data-testid="pack-state"
            style={{
              color: readiness.requiredReady
                ? 'var(--trout-color-primary)'
                : !readiness.anyReady
                  ? 'var(--trout-color-text-muted)'
                  : 'var(--trout-status-fair)',
            }}
          >
            {!readiness.anyReady
              ? 'Not downloaded'
              : readiness.requiredReady
                ? readiness.partialOptional
                  ? 'Ready offline — optional sections not downloaded'
                  : 'Ready offline'
                : 'Partial'}
          </span>
          {!readiness.requiredReady && onRedownload && (
            <Button
              size="sm"
              data-testid="pack-redownload"
              className="focus-ring"
              disabled={offline}
              title={offline ? 'Pinning needs a network connection — you are offline right now.' : undefined}
              onClick={onRedownload}
            >
              Download again
            </Button>
          )}
          {onVerify && (
            <Button variant="secondary" size="sm" className="focus-ring" onClick={onVerify}>
              Verify
            </Button>
          )}
          {onRemove &&
            (confirmRemove ? (
              <ConfirmButton
                label="Remove pack"
                confirmLabel="Really remove this pack"
                cancelLabel="Keep"
                onConfirm={onRemove}
              />
            ) : (
              <Button variant="secondary" size="sm" className="focus-ring" onClick={onRemove}>
                Remove
              </Button>
            ))}
        </>
      )}
    </span>
  );
}
