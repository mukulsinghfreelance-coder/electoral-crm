// ─── OTPModal.jsx ─────────────────────────────────────────────────────────────
import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Btn } from '../ui/Btn'
import { APPS_SCRIPT } from '../../constants/data'

export function OTPModal({ open, onClose, onSuccess, pin }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState('')
  const verify = () => {
    if (val === pin) { setVal(''); setErr(''); onSuccess() }
    else setErr('Incorrect PIN. Try again.')
  }
  return (
    <Modal open={open} onClose={() => { setVal(''); setErr(''); onClose() }} title="🔐 Admin PIN Required">
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Enter admin PIN to continue.</p>
      <Field label="PIN" error={err}>
        <Input type="password" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && verify()} autoFocus />
      </Field>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <Btn onClick={() => { setVal(''); setErr(''); onClose() }}>Cancel</Btn>
        <Btn variant="prim" onClick={verify}>Verify</Btn>
      </div>
    </Modal>
  )
}

