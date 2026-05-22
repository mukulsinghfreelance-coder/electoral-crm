import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(url, key)

// ── DEFAULT LABELS ────────────────────────────────────────────────────────────
export const DEFAULT_LABELS = {
  mandal:     "Mandal",
  panchayat:  "Panchayat",
  booth:      "Booth",
  village:    "Village",
  boothName:  "Booth Name",
  caste:      "Caste",
  tag:        "Tag",
  contacts:   "Contacts",
  karyakarta: "Karyakarta",
  whatsapp:   "WhatsApp No.",  // ← ADD THIS
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export async function fetchSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single()
  if (error) throw error
  return dbToSettings(data)
}

export async function saveSettings(settings) {
  const { data: existing } = await supabase.from('settings').select('id').limit(1).single()
  const row = settingsToDb(settings)
  if (existing) {
    const { error } = await supabase.from('settings').update(row).eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('settings').insert(row)
    if (error) throw error
  }
}

// ─── CONTACTS ────────────────────────────────────────────────────────────────
export async function fetchContacts() {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(dbToContact)
}

export async function insertContact(contact) {
  const { data, error } = await supabase
    .from('contacts')
    .insert(contactToDb(contact))
    .select()
    .single()
  if (error) throw error
  return dbToContact(data)
}

export async function updateContact(id, contact) {
  const { data, error } = await supabase
    .from('contacts')
    .update(contactToDb(contact))
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return dbToContact(data)
}

export async function deleteContact(id) {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw error
}

// ─── BOOTHS ──────────────────────────────────────────────────────────────────
export async function fetchBooths() {
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .order('bno', { ascending: true })
  if (error) throw error
  return data.map(dbToBooth)
}

export async function insertBooth(booth) {
  const { data, error } = await supabase
    .from('booths')
    .insert(boothToDb(booth))
    .select()
    .single()
  if (error) throw error
  return dbToBooth(data)
}

export async function updateBooth(id, booth) {
  const { data, error } = await supabase
    .from('booths')
    .update(boothToDb(booth))
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return dbToBooth(data)
}

export async function deleteBooth(id) {
  const { error } = await supabase.from('booths').delete().eq('id', id)
  if (error) throw error
}

export async function upsertBoothByBno(boothData) {
  const { data, error } = await supabase
    .from('booths')
    .upsert(boothToDb(boothData), { onConflict: 'bno' })
    .select()
    .single()
  if (error) throw error
  return dbToBooth(data)
}

// ─── MAPPERS — DB ↔ App ───────────────────────────────────────────────────────
function dbToSettings(d) {
  return {
    state:        d.state        || 'Bihar',
    ls:           d.ls           || 'Patna Sahib',
    vs:           d.vs           || 'Bankipur',
    totalVoters:  d.total_voters || '',
    totalBooths:  d.total_booths || '',
    mandals:      d.mandals      || [],
    castes:       d.castes       || [],
    parties:      d.parties      || ['BJP+', 'Congress+', 'Others+'],
    elections:    d.elections    || ['Election 2015', 'Election 2020', 'Election 2024'],
    adminPin:     d.admin_pin    || '1234',
    sheetsUrl:    d.sheets_url   || '',
  }
}

function settingsToDb(s) {
  return {
    state:        s.state,
    ls:           s.ls,
    vs:           s.vs,
    total_voters: s.totalVoters,
    total_booths: s.totalBooths,
    mandals:      s.mandals,
    castes:       s.castes,
    parties:      s.parties,
    elections:    s.elections,
    admin_pin:    s.adminPin,
    sheets_url:   s.sheetsUrl,
  }
}

function dbToContact(d) {
  return {
    id:        d.id,
    name:      d.name      || '',
    phone:     d.phone     || '',
    wa:        d.wa        || '',
    mandal:    d.mandal    || '',
    panchayat: d.panchayat || '',
    village:   d.village   || '',
    bno:       d.bno       || '',
    bnm:       d.bnm       || '',
    tag:       d.tag       || '',
    caste:     d.caste     || '',
    notes:     d.notes     || '',
  }
}

function contactToDb(c) {
  return {
    name:      c.name,
    phone:     c.phone,
    wa:        c.wa        || '',
    mandal:    c.mandal    || '',
    panchayat: c.panchayat || '',
    village:   c.village   || '',
    bno:       c.bno       || '',
    bnm:       c.bnm       || '',
    tag:       c.tag       || '',
    caste:     c.caste     || '',
    notes:     c.notes     || '',
  }
}

function dbToBooth(d) {
  return {
    id:        d.id,
    bno:       d.bno       || '',
    bnm:       d.bnm       || '',
    mandal:    d.mandal    || '',
    panchayat: d.panchayat || '',
    voters:    d.voters    || 0,
    rating:    d.rating    || '',
    castes:    d.castes    || ['', '', ''],
    elec:      d.elec      || [
      { cast: 0, votes: [0, 0, 0] },
      { cast: 0, votes: [0, 0, 0] },
      { cast: 0, votes: [0, 0, 0] },
    ],
    notes:     d.notes     || '',
  }
}

function boothToDb(b) {
  return {
    bno:       b.bno,
    bnm:       b.bnm       || '',
    mandal:    b.mandal    || '',
    panchayat: b.panchayat || '',
    voters:    b.voters    || 0,
    rating:    b.rating    || '',
    castes:    b.castes    || ['', '', ''],
    elec:      b.elec      || [],
    notes:     b.notes     || '',
  }
}

// ── UPDATE dbToSettings function ──────────────────────────────────────────────
// Find the existing dbToSettings function and replace it with this:

function dbToSettings(d) {
  return {
    state:        d.state        || 'Bihar',
    ls:           d.ls           || 'Patna Sahib',
    vs:           d.vs           || 'Bankipur',
    totalVoters:  d.total_voters || '',
    totalBooths:  d.total_booths || '',
    mandals:      d.mandals      || [],
    castes:       d.castes       || [],
    parties:      d.parties      || ['BJP+', 'Congress+', 'Others+'],
    elections:    d.elections    || ['Election 2015', 'Election 2020', 'Election 2024'],
    adminPin:     d.admin_pin    || '1234',
    sheetsUrl:    d.sheets_url   || '',
    labels:       { ...DEFAULT_LABELS, ...(d.labels || {}) }, // ← ADD THIS
  }
}

// ── UPDATE settingsToDb function ──────────────────────────────────────────────
// Find the existing settingsToDb function and replace it with this:

function settingsToDb(s) {
  return {
    state:        s.state,
    ls:           s.ls,
    vs:           s.vs,
    total_voters: s.totalVoters,
    total_booths: s.totalBooths,
    mandals:      s.mandals,
    castes:       s.castes,
    parties:      s.parties,
    elections:    s.elections,
    admin_pin:    s.adminPin,
    sheets_url:   s.sheetsUrl,
    labels:       s.labels || DEFAULT_LABELS, // ← ADD THIS
  }
}
