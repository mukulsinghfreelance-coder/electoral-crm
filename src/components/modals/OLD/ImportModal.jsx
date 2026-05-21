// ─── ImportModal.jsx ──────────────────────────────────────────────────────────
import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Btn } from '../ui/Btn'
import { APPS_SCRIPT } from '../../constants/data'

export function ImportModal({ open, onClose, onImport }) {
  const fileRef = React.useRef()
  return (
    <Modal open={open} onClose={onClose} title="⬆️ Import Contacts (Admin)">
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 9 }}>
        Columns: Name, Phone, WhatsApp, Mandal, Panchayat, Village, BoothNo, BoothName, Tag, Caste, Notes
      </p>
      <Field label="Paste CSV text">
        <textarea
          id="csv-paste"
          style={{ width: '100%', padding: '5px 8px', fontSize: 11, fontFamily: 'monospace', border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', minHeight: 80, resize: 'vertical' }}
          placeholder="Name,Phone,WhatsApp,Mandal,Panchayat,Village,BoothNo,BoothName,Tag,Caste,Notes"
        />
      </Field>
      <div style={{ marginBottom: 9 }}>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={e => {
            const f = e.target.files[0]
            if (!f) return
            const r = new FileReader()
            r.onload = ev => document.getElementById('csv-paste').value = ev.target.result
            r.readAsText(f)
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="prim" onClick={() => onImport(document.getElementById('csv-paste').value)}>Import</Btn>
      </div>
    </Modal>
  )
}
