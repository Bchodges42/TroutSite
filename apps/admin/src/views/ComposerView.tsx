// OWNER: ROLE 4. Weekly report composer: stream picker, plain-text body, hot-patterns picker
// (fed by the content pack), optional photo URL. Drafts save locally (scoped to the signed-in
// shop — F16); publishing posts to POST /v1/portal/reports (the product's only live write
// route) with a stable Idempotency-Key (F02/F15).
import { useMemo, useState, type FormEvent } from 'react';
import { Button, Card, Chip } from '@trout/ui';
import type { FlyPattern, HotPattern, ShopReport, Stream } from '@trout/contracts';
import { publishReport, idempotencyKeyFor, ApiError } from '../api/client.js';
import { emptyDraft, saveDraft, deleteDraft, type ReportDraft } from '../state/drafts.js';
import type { Catalog } from '../pack.js';

const BODY_MIN = 10;
const BODY_MAX = 2000;

interface DraftErrors {
  date?: string;
  body?: string;
  hotPatterns?: string;
  photoUrl?: string;
}

function validate(draft: ReportDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) errors.date = 'Pick a report date (YYYY-MM-DD).';
  const body = draft.body.trim();
  if (body.length === 0) errors.body = 'Write the report — even two honest sentences help.';
  else if (body.length < BODY_MIN) errors.body = `A little more detail helps anglers (at least ${BODY_MIN} characters).`;
  else if (body.length > BODY_MAX) errors.body = `Keep it under ${BODY_MAX} characters.`;
  for (const hp of draft.hotPatterns) {
    if (!hp.patternId) errors.hotPatterns = 'Pick a pattern for each hot-fly row (or remove the row).';
    if (hp.hookSize !== undefined && (!Number.isInteger(hp.hookSize) || hp.hookSize < 1 || hp.hookSize > 32)) {
      errors.hotPatterns = 'Hook sizes should be between 1 and 32.';
    }
  }
  if (draft.photoUrl && !/^https:\/\/\S+\.\S+/.test(draft.photoUrl)) {
    errors.photoUrl = 'Photo link must be a https:// URL.';
  }
  return errors;
}

function toInput(draft: ReportDraft): Parameters<typeof publishReport>[0] {
  return {
    streamId: draft.streamId ?? undefined,
    date: draft.date,
    body: draft.body.trim(),
    hotPatterns: draft.hotPatterns.filter((hp) => hp.patternId),
    photoUrl: draft.photoUrl || undefined,
  };
}

export function ComposerView({
  catalog,
  shopId,
  initialDraft,
  onSaved,
  onPublished,
}: {
  catalog: Catalog;
  /** Verified shop identity (from GET /v1/portal/me) — drafts are scoped to it (F16). */
  shopId: string;
  initialDraft?: ReportDraft | null;
  onSaved?: () => void;
  onPublished?: (report: ShopReport) => void;
}) {
  const [draft, setDraft] = useState<ReportDraft>(() => initialDraft ?? emptyDraft(shopId));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'publishing' | 'published'>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  // Local-storage problems are surfaced SEPARATELY from the server result (F15):
  // neither of these ever claims the publish itself failed.
  const [localError, setLocalError] = useState<string | null>(null);

  const patternsByName = useMemo(() => {
    const m = new Map<string, FlyPattern>();
    for (const p of catalog.patterns) m.set(p.id, p);
    return m;
  }, [catalog]);

  const streamsByRegion = useMemo(() => {
    const m = new Map<string, Stream[]>();
    for (const s of catalog.streams) {
      const list = m.get(s.regionId) ?? [];
      list.push(s);
      m.set(s.regionId, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return m;
  }, [catalog]);

  function patch(patchObj: Partial<ReportDraft>) {
    setDraft((d) => ({ ...d, ...patchObj }));
    setStatus('idle');
  }

  function addPatternRow() {
    patch({ hotPatterns: [...draft.hotPatterns, { patternId: '' } as HotPattern] });
  }

  function updatePatternRow(index: number, next: HotPattern) {
    patch({ hotPatterns: draft.hotPatterns.map((hp, i) => (i === index ? next : hp)) });
  }

  function removePatternRow(index: number) {
    patch({ hotPatterns: draft.hotPatterns.filter((_, i) => i !== index) });
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);
    try {
      saveDraft(shopId, draft);
      setStatus('saving');
      setErrors({});
      onSaved?.();
    } catch {
      // A failed LOCAL save says so — it is not a server rejection (F15).
      setStatus('idle');
      setLocalError('The draft could not be saved in this browser (storage full or blocked). Copy the text somewhere safe — publishing is unaffected.');
    }
  }

  async function handlePublish(event: FormEvent) {
    event.preventDefault();
    const found = validate(draft);
    setErrors(found);
    setApiError(null);
    setLocalError(null);
    if (Object.keys(found).length > 0) return;
    setStatus('publishing');
    // Stable per (draft id + content revision): an unchanged retry reuses the SAME
    // key so the server replays the accepted report instead of double-inserting.
    const idempotencyKey = idempotencyKeyFor(draft.id, toInput(draft));
    try {
      const report = await publishReport(toInput(draft), { idempotencyKey });
      // SERVER ACCEPTANCE IS FINAL (F15): the report is published with attribution.
      // Nothing after this point may report the publish as failed. The draft's job
      // is done — it must not stay editable, or the same body could be published
      // again (a duplicate).
      setStatus('published');
      setDraft(emptyDraft(shopId));
      onPublished?.(report);
      // Local cleanup is best-effort and reported separately: a failed localStorage
      // write must never turn an accepted publish into a reported failure.
      try {
        deleteDraft(shopId, draft.id);
      } catch {
        setLocalError('Published — but the local draft copy could not be removed from this browser (storage full or blocked). Delete it manually under "My reports" to avoid republishing it.');
      }
    } catch (err) {
      // Not accepted: the draft (and its idempotency key derivation) stays intact —
      // a retry of the same content derives the SAME key, so the server replays any
      // report that was in fact accepted despite the error the client saw.
      setStatus('idle');
      setApiError(err instanceof ApiError ? err.message : 'Publishing failed — check your connection.');
    }
  }

  return (
    <Card>
      <form onSubmit={handlePublish}>
        <h2>Weekly report</h2>
        <p className="portal-muted">
          Plain-text, honest, and attributed to {`\u201Cyour shop\u201D`} automatically. What worked,
          where, and when — that\u2019s the whole ask.
        </p>

        <div className="portal-grid">
          <label className="field">
            <span className="field__label">Water</span>
            <select
              aria-label="Water"
              value={draft.streamId ?? ''}
              onChange={(e) => patch({ streamId: e.target.value || null })}
            >
              <option value="">— general / multiple waters —</option>
              {[...streamsByRegion.entries()].map(([regionId, streams]) => (
                <optgroup key={regionId} label={regionId}>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Report date</span>
            <input
              type="date"
              aria-label="Report date"
              value={draft.date}
              onChange={(e) => patch({ date: e.target.value })}
            />
            {errors.date ? <span className="portal-error">{errors.date}</span> : null}
          </label>
        </div>

        <label className="field">
          <span className="field__label">Report (plain text)</span>
          <textarea
            aria-label="Report body"
            rows={6}
            maxLength={BODY_MAX}
            placeholder={'e.g. Sulphurs came off 7:30–8:30pm below the weir. Size 16 parachute in the soft seam behind the rock. Morning has been nymph game — PT and a sowbug dropper.'}
            value={draft.body}
            onChange={(e) => patch({ body: e.target.value })}
          />
          <span className="field__hint">
            {draft.body.trim().length}/{BODY_MAX} characters
          </span>
          {errors.body ? <span className="portal-error">{errors.body}</span> : null}
        </label>

        <fieldset className="portal-fieldset">
          <legend className="field__label">Hot patterns</legend>
          {draft.hotPatterns.map((hp, i) => {
            const pattern = patternsByName.get(hp.patternId);
            return (
              <div className="portal-pattern-row" key={i}>
                <select
                  aria-label={`Hot pattern ${i + 1}`}
                  value={hp.patternId}
                  onChange={(e) => updatePatternRow(i, { ...hp, patternId: e.target.value })}
                >
                  <option value="">— pick a pattern —</option>
                  {catalog.patterns.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={32}
                  aria-label={`Hook size ${i + 1}`}
                  placeholder="hook #"
                  value={hp.hookSize ?? ''}
                  onChange={(e) =>
                    updatePatternRow(i, {
                      ...hp,
                      hookSize: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
                {pattern ? <Chip tone="neutral">{pattern.type}</Chip> : null}
                <Button variant="ghost" size="sm" onClick={() => removePatternRow(i)} aria-label={`Remove pattern ${i + 1}`}>
                  ✕
                </Button>
              </div>
            );
          })}
          <Button variant="secondary" size="sm" onClick={addPatternRow}>
            + Add pattern
          </Button>
          {errors.hotPatterns ? <p className="portal-error">{errors.hotPatterns}</p> : null}
        </fieldset>

        <label className="field">
          <span className="field__label">Photo link (optional)</span>
          <input
            type="url"
            aria-label="Photo link"
            placeholder="https://…"
            value={draft.photoUrl}
            onChange={(e) => patch({ photoUrl: e.target.value })}
          />
          {errors.photoUrl ? <span className="portal-error">{errors.photoUrl}</span> : null}
        </label>

        {apiError ? (
          <p className="portal-error" role="alert">
            {apiError}
          </p>
        ) : null}
        {localError ? (
          <p className="portal-error" role="alert">
            {localError}
          </p>
        ) : null}
        {status === 'published' ? (
          <p className="portal-success" role="status">
            Published — thank you! Your report now appears with attribution in the public report feed.
          </p>
        ) : null}
        {status === 'saving' ? (
          <p className="portal-success" role="status">
            Draft saved in this browser.
          </p>
        ) : null}

        <div className="portal-actions">
          <Button variant="secondary" onClick={handleSave} disabled={status === 'publishing'}>
            Save draft (this browser)
          </Button>
          <Button type="submit" disabled={status === 'publishing'}>
            {status === 'publishing' ? 'Publishing…' : 'Publish report'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
