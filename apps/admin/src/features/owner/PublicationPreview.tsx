import type { PublicationPreview } from './ownerClient.js';

export function PublicationPreviewView({ preview }: { preview: PublicationPreview | null }) {
  const publication = preview?.publication;
  return <section aria-label="Publication candidate">
    <h2 className="owner-section-title">Publication candidate</h2>
    {!preview ? <p className="portal-muted">Candidate preview unavailable right now.</p>
      : preview.state === 'not-prepared' ? <p className="portal-muted">No candidate has been prepared. The preview appears after the operator builds a candidate with the normal snapshot builder.</p>
        : <p role="status">{preview.state === 'ready' ? 'Ready for owner review. Live data is unchanged.'
          : preview.state === 'published' ? 'This reviewed candidate was published.'
            : preview.state === 'expired' ? 'This candidate is more than an hour old. Prepare and review a fresh candidate before publication.'
              : preview.state === 'base-changed' ? 'Live data changed since preparation. Prepare and review a new candidate before publication.'
              : 'Candidate files could not be verified. Prepare a new candidate.'}</p>}
    {publication && <>
      <p>Prepared {new Date(publication.preparedAt).toLocaleString()} · {publication.affectedWaters} affected waters · {publication.fileChanges} changed files</p>
      <p className="portal-muted">Candidate {publication.id}. Publication uses these built bytes; this view has no publishing controls. Snapshot build outcomes appear in Pipeline jobs.</p>
      <p className="portal-muted">Wording and claim values longer than 4,000 characters are abbreviated. Review full candidate files when a value is abbreviated or a water is omitted.</p>
      {publication.omittedWaters > 0 && <p>{publication.omittedWaters} additional affected waters are omitted from this bounded preview.</p>}
      {publication.waters.length === 0 && <p>No source, species, opportunity, access, regulation, evidence or stocking claims changed. File changes may reflect new measurements or generation times.</p>}
      {publication.waters.map((water) => <details key={water.id} className="owner-candidate-water">
        <summary>{water.name} · {water.changes.length} changed claim areas</summary>
        <div className="owner-preview-columns">
          <div><h3>Current public wording</h3>{water.beforeWording.map((line, index) => <p key={index}>{line}</p>)}</div>
          <div><h3>Candidate public wording</h3>{water.afterWording.map((line, index) => <p key={index}>{line}</p>)}</div>
        </div>
        {water.changes.map((change) => <details key={change.field}>
          <summary>{change.field}{change.truncated ? ' (abbreviated — review the full candidate)' : ''}</summary>
          <div className="owner-preview-columns">
            <div><h4>Before</h4><pre>{change.before ?? 'Absent'}</pre></div>
            <div><h4>After</h4><pre>{change.after ?? 'Absent'}</pre></div>
          </div>
        </details>)}
      </details>)}
    </>}
  </section>;
}
