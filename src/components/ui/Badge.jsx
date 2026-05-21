// ─── src/components/ui/Badge.jsx ─────────────────────────────────────────────
import React from 'react'
import { TAG_STYLE, RATING_STYLE } from '../../constants/data'

export function Badge({ tag }) {
  const s = TAG_STYLE[tag] || { bg: '#F1EFE8', cl: '#444441' }
  return (
    <span style={{ background: s.bg, color: s.cl, padding: '2px 7px', borderRadius: 100, fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {tag}
    </span>
  )
}

export function RatingBadge({ r }) {
  const s = RATING_STYLE[r] || { bg: '#F1EFE8', cl: '#444441' }
  return (
    <span style={{ background: s.bg, color: s.cl, width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500 }}>
      {r}
    </span>
  )
}





