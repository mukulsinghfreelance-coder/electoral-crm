import React, { useState, useMemo, useCallback } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { TAGS, INIT_SETTINGS, INIT_CONTACTS, INIT_BOOTHS } from './constants/data'
import { exportContactsCSV, parseContactsCSV } from './utils/csv'

// Layout
import ConstantsBar from './components/layout/ConstantsBar'
import Sidebar      from './components/layout/Sidebar'

// Contacts
import ContactTable  from './components/contacts/ContactTable'
import ContactForm   from './components/contacts/ContactForm'
import ContactDetail from './components/contacts/ContactDetail'

// Booths
import BoothTable  from './components/booths/BoothTable'
import BoothForm   from './components/booths/BoothForm'
import BoothDetail from './components/booths/BoothDetail'

// Modals
import { OTPModal, ConstantsModal, ImportModal, SheetsModal, SettingsModal } from './components/modals'

export default function App() {
  // ── Persistent state ──────────────────────────────────────────────────────
  const [settings, setSettings] = useLocalStorage('crm_settings', INIT_SETTINGS)
  const [contacts, setContacts] = useLocalStorage('crm_contacts', INIT_CONTACTS)
  const [booths,   setBooths]   = useLocalStorage('crm_booths',   INIT_BOOTHS)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [screen,     setScreen]     = useState('contacts')
  const [activeTag,  setActiveTag]  = useState('')
  const [selContact, setSelContact] = useState(null)
  const [selBooth,   setSelBooth]   = useState(null)
  const [page,       setPage]       = useState(1)
  const [sort,       setSort]       = useState({ col: 'name', dir: 'asc' })
  const [search,     setSearch]     = useState('')
  const [fMandal,    setFMandal]    = useState('')
  const [fPanch,     setFPanch]     = useState('')
  const [fBooth,     setFBooth]     = useState('')
  const [fTag,       setFTag]       = useState('')
  const [fCaste,     setFCaste]     = useState('')
  const [boothSearch,setBoothSearch]= useState('')
  const [bfRating,   setBfRating]   = useState('')
  const [bfPanch,    setBfPanch]    = useState('')
  const [syncStatus, setSyncStatus] = useState('')

  // ── Modal visibility ──────────────────────────────────────────────────────
  const [showAdd,      setShowAdd]      = useState(false)
  const [editContact,  setEditContact]  = useState(null)
  const [showBoothAdd, setShowBoothAdd] = useState(false)
  const [editBooth,    setEditBooth]    = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showConst,    setShowConst]    = useState(false)
  const [showImport,   setShowImport]   = useState(false)
  const [showSheets,   setShowSheets]   = useState(false)
  const [showOTP,      setShowOTP]      = useState(false)
  const [otpAction,    setOtpAction]    = useState(null)
  const [isAdmin,      setIsAdmin]      = useState(false)

  const PS = 20 // page size

  // ── Admin gate ────────────────────────────────────────────────────────────
  const requireAdmin = useCallback(action => {
    if (isAdmin) { action(); return }
    setOtpAction(() => action)
    setShowOTP(true)
  }, [isAdmin])

  // ── Google Sheets sync ────────────────────────────────────────────────────
  const syncToSheets = async contact => {
    if (!settings.sheetsUrl) return
    setSyncStatus('syncing')
    try {
      await fetch(settings.sheetsUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'add', ...contact }),
        headers: { 'Content-Type': 'text/plain' },
      })
      setSyncStatus('ok'); setTimeout(() => setSyncStatus(''), 3000)
    } catch {
      setSyncStatus('error'); setTimeout(() => setSyncStatus(''), 3000)
    }
  }

  const pullFromSheets = async () => {
    if (!settings.sheetsUrl) { alert('Configure Google Sheets URL first.'); return }
    setSyncStatus('syncing')
    try {
      const res  = await fetch(settings.sheetsUrl)
      const data = await res.json()
      if (data.status === 'ok' && data.data) {
        let added = 0
        data.data.forEach(row => {
          const phone = String(row.Phone || '').trim()
          if (phone && !contacts.find(c => c.phone === phone)) {
            setContacts(cs => [...cs, {
              id: Math.max(0, ...cs.map(c => c.id)) + 1,
              name: row.Name || '', phone, wa: row.WhatsApp || '',
              mandal: row.Mandal || '', panchayat: row.Panchayat || '',
              village: row.Village || '', bno: row.BoothNo || '',
              bnm: row.BoothName || '',
              tag: TAGS.includes(row.Tag) ? row.Tag : '',
              caste: row.Caste || '', notes: row.Notes || '',
            }])
            added++
          }
        })
        setSyncStatus('ok'); setTimeout(() => setSyncStatus(''), 3000)
        alert(`Pulled ${added} new contacts from Google Sheets.`)
      }
    } catch {
      setSyncStatus('error'); setTimeout(() => setSyncStatus(''), 3000)
      alert('Failed. Check URL and sheet permissions.')
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const allPanchs = useMemo(() =>
    [...new Set(settings.mandals.flatMap(m => m.panchayats))].sort()
  , [settings])

  const tagCounts = useMemo(() => {
    const t = {}
    contacts.forEach(c => { if (c.tag) t[c.tag] = (t[c.tag] || 0) + 1 })
    return t
  }, [contacts])

  const filteredContacts = useMemo(() => {
    const q  = search.toLowerCase()
    const ft = fTag || activeTag
    let r = contacts.filter(c => {
      const ok = !q || (c.name + c.phone + c.wa + c.mandal + c.panchayat + c.village + c.bno + c.bnm + c.tag + c.caste).toLowerCase().includes(q)
      return ok
        && (!fMandal || c.mandal    === fMandal)
        && (!fPanch  || c.panchayat === fPanch)
        && (!fBooth  || c.bno       === fBooth)
        && (!ft      || c.tag       === ft)
        && (!fCaste  || c.caste     === fCaste)
    })
    r.sort((a, b) => {
      let av = a[sort.col] || '', bv = b[sort.col] || ''
      if (sort.col === 'bno') { av = parseInt(av) || 0; bv = parseInt(bv) || 0; return sort.dir === 'asc' ? av - bv : bv - av }
      return sort.dir === 'asc' ? av.toString().localeCompare(bv.toString()) : bv.toString().localeCompare(av.toString())
    })
    return r
  }, [contacts, search, fMandal, fPanch, fBooth, fTag, fCaste, activeTag, sort])

  const filteredBooths = useMemo(() => {
    const q = boothSearch.toLowerCase()
    return booths.filter(b => {
      const ok = !q || (b.bno + b.bnm + (b.mandal || '') + (b.panchayat || '') + b.castes.join(' ')).toLowerCase().includes(q)
      return ok && (!bfRating || b.rating === bfRating) && (!bfPanch || b.panchayat === bfPanch)
    })
  }, [booths, boothSearch, bfRating, bfPanch])

  const pages = Math.max(1, Math.ceil(filteredContacts.length / PS))
  const slice = filteredContacts.slice((page - 1) * PS, page * PS)

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const saveContact = f => {
    const obj = { ...f, id: editContact?.id || (Math.max(0, ...contacts.map(c => c.id)) + 1) }
    setContacts(cs => editContact ? cs.map(c => c.id === obj.id ? obj : c) : [...cs, obj])
    setShowAdd(false); setEditContact(null); setSelContact(obj)
  }
  const delContact = id => {
    if (!confirm('Delete this contact?')) return
    setContacts(cs => cs.filter(c => c.id !== id)); setSelContact(null)
  }
  const saveBooth = f => {
    const obj = { ...f, id: editBooth?.id || (Math.max(0, ...booths.map(b => b.id)) + 1) }
    setBooths(bs => editBooth ? bs.map(b => b.id === obj.id ? obj : b) : [...bs, obj])
    setShowBoothAdd(false); setEditBooth(null); setSelBooth(obj)
  }
  const delBooth = id => {
    if (!confirm('Delete this booth?')) return
    setBooths(bs => bs.filter(b => b.id !== id)); setSelBooth(null)
  }
  const doImport = txt => {
    const parsed = parseContactsCSV(txt)
    parsed.forEach(c => setContacts(cs => [...cs, { ...c, id: Math.max(0, ...cs.map(x => x.id)) + 1 }]))
    alert(`${parsed.length} contacts imported.`); setShowImport(false)
  }

  // ── Nav helpers ───────────────────────────────────────────────────────────
  const navContacts = () => { setScreen('contacts'); setActiveTag(''); setFTag(''); setSearch(''); setPage(1); setSelContact(null) }
  const filterTag   = tag => { setScreen('contacts'); setActiveTag(tag); setFTag(''); setSearch(''); setPage(1); setSelContact(null) }
  const navBooths   = () => { setScreen('booths'); setActiveTag(''); setSelBooth(null) }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-background-primary)', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>

      <ConstantsBar
        settings={settings}
        syncStatus={syncStatus}
        onEdit={() => requireAdmin(() => setShowConst(true))}
        onPull={pullFromSheets}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          screen={screen} activeTag={activeTag}
          contacts={contacts} booths={booths} settings={settings} tagCounts={tagCounts}
          onNavContacts={navContacts}
          onNavMandal={navContacts}
          onNavPanchayat={navContacts}
          onFilterTag={filterTag}
          onNavBooths={navBooths}
          onOpenSettings={() => requireAdmin(() => setShowSettings(true))}
          onOpenSheets={() => requireAdmin(() => setShowSheets(true))}
        />

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {screen === 'contacts' && (
            <ContactTable
              slice={slice} selContact={selContact} sort={sort}
              onSort={col => setSort(s => s.col === col ? { ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })}
              onSelect={c => setSelContact(c)}
              filteredCount={filteredContacts.length}
              page={page} pages={pages}
              onPrevPage={() => setPage(p => Math.max(1, p - 1))}
              onNextPage={() => setPage(p => Math.min(pages, p + 1))}
              search={search} onSearch={v => { setSearch(v); setPage(1) }}
              fMandal={fMandal} fPanch={fPanch} fBooth={fBooth} fCaste={fCaste} fTag={fTag} activeTag={activeTag}
              onFMandal={v => { setFMandal(v); setFPanch(''); setPage(1) }}
              onFPanch={v  => { setFPanch(v);  setPage(1) }}
              onFBooth={v  => { setFBooth(v);  setPage(1) }}
              onFCaste={v  => { setFCaste(v);  setPage(1) }}
              onFTag={v    => { setFTag(v); setActiveTag(''); setPage(1) }}
              settings={settings} contacts={contacts}
              onAdd={() => { setEditContact(null); setShowAdd(true) }}
              onExport={() => exportContactsCSV(filteredContacts)}
              onImport={() => requireAdmin(() => setShowImport(true))}
            />
          )}
          {screen === 'booths' && (
            <BoothTable
              filteredBooths={filteredBooths} booths={booths}
              selBooth={selBooth} onSelect={b => setSelBooth(b)}
              onAdd={() => { setEditBooth(null); setShowBoothAdd(true) }}
              settings={settings}
              boothSearch={boothSearch} onSearch={setBoothSearch}
              bfRating={bfRating} onBfRating={setBfRating}
              bfPanch={bfPanch}   onBfPanch={setBfPanch}
              allPanchs={allPanchs}
            />
          )}
        </div>

        {/* DETAIL PANEL */}
        <div style={{ width: 240, minWidth: 240, borderLeft: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {screen === 'contacts' && (
            <ContactDetail
              contact={contacts.find(c => c.id === selContact?.id) || null}
              onEdit={c => { setEditContact(c); setShowAdd(true) }}
              onDelete={delContact}
            />
          )}
          {screen === 'booths' && (
            <BoothDetail
              booth={booths.find(b => b.id === selBooth?.id) || null}
              settings={settings}
              onEdit={b => { setEditBooth(b); setShowBoothAdd(true) }}
              onDelete={delBooth}
            />
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      <OTPModal
        open={showOTP}
        onClose={() => setShowOTP(false)}
        pin={settings.adminPin}
        onSuccess={() => { setIsAdmin(true); setShowOTP(false); if (otpAction) { otpAction(); setOtpAction(null) } }}
      />
      <SettingsModal
        open={showSettings} onClose={() => setShowSettings(false)}
        settings={settings} setSettings={setSettings}
      />
      <ContactForm
        open={showAdd} onClose={() => { setShowAdd(false); setEditContact(null) }}
        initial={editContact} settings={settings}
        onSave={saveContact} syncToSheets={syncToSheets}
      />
      <BoothForm
        open={showBoothAdd} onClose={() => { setShowBoothAdd(false); setEditBooth(null) }}
        initial={editBooth} settings={settings} onSave={saveBooth}
      />
      <ConstantsModal
        open={showConst} onClose={() => setShowConst(false)}
        settings={settings}
        onSave={f => setSettings(s => ({ ...s, ...f }))}
      />
      <ImportModal
        open={showImport} onClose={() => setShowImport(false)}
        onImport={doImport}
      />
      <SheetsModal
        open={showSheets} onClose={() => setShowSheets(false)}
        settings={settings} setSettings={setSettings}
      />
    </div>
  )
}