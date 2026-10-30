import { useEffect, useState } from 'react'

interface Credit {
  usedFor: string
  title: string
  author: string
  authorUrl?: string
  url: string
  licence: string
  licenceUrl?: string
  note?: string
}

/** CC BY attribution for every third-party 3D model (written by scripts/credits.mjs). */
export function Credits() {
  const [data, setData] = useState<{ changes: string; credits: Credit[] } | null>(null)
  useEffect(() => {
    fetch('/models/credits.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
  }, [])
  if (!data) return null
  return (
    <details className="credits">
      <summary>3D model credits ({data.credits.length})</summary>
      <ul>
        {data.credits.map((c) => (
          <li key={c.url}>
            <a href={c.url} target="_blank" rel="noreferrer">
              {c.title}
            </a>{' '}
            by{' '}
            {c.authorUrl ? (
              <a href={c.authorUrl} target="_blank" rel="noreferrer">
                {c.author}
              </a>
            ) : (
              c.author
            )}
            , licensed under{' '}
            {c.licenceUrl ? (
              <a href={c.licenceUrl} target="_blank" rel="noreferrer">
                {c.licence}
              </a>
            ) : (
              c.licence
            )}
            <span>{c.usedFor}</span>
            {c.note && <span className="note">{c.note}</span>}
          </li>
        ))}
      </ul>
      <p className="muted small" style={{ marginTop: 12 }}>
        Changes: {data.changes}
      </p>
    </details>
  )
}
