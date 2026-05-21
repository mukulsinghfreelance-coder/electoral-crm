// ─── SheetsModal.jsx ──────────────────────────────────────────────────────────
import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Btn } from '../ui/Btn'
import { APPS_SCRIPT } from '../../constants/data'

export function SheetsModal({ open, onClose, settings, setSettings }) {
  const [url, setUrl] = React.useState(settings.sheetsUrl || '')
  React.useEffect(() => { if (open) setUrl(settings.sheetsUrl || '') }, [open])
  const copyCode = () => navigator.clipboard.writeText(APPS_SCRIPT).then(() => alert('Apps Script code copied!'))
  return (
    <Modal open={open} onClose={onClose} title="🔗 Google Sheets Integration" wide>
      <div style={{ background: '#E6F1FB', borderRadius: 6, padding: '10px 12px', marginBottom: 12, fontSize: 11, color: '#0C447C', lineHeight: 1.7 }}>
        <b>One-time setup (~5 min):</b><br />
        1. Open Google Sheets → create sheet named <b>Contacts</b><br />
        2. Extensions → Apps Script → paste code → Deploy → New deployment → Web App<br />
        3. Execute as: <b>Me</b> | Access: <b>Anyone</b> → Deploy → copy URL<br />
        4. Paste the URL below and save.
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 500 }}>Apps Script code</span>
          <Btn onClick={copyCode}>📋 Copy</Btn>
        </div>
        <pre style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, padding: '8px 10px', fontSize: 9, overflowX: 'auto', maxHeight: 120, whiteSpace: 'pre-wrap', color: 'var(--color-text-primary)' }}>
          {APPS_SCRIPT}
        </pre>
      </div>
      <Field label="Deployed Web App URL">
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" />
      </Field>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 10 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="prim" onClick={() => { setSettings(s => ({ ...s, sheetsUrl: url })); onClose() }}>Save</Btn>
      </div>
    </Modal>
  )
}

