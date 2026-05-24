import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)

// ─── DEFAULT LABELS ───────────────────────────────────────────────────────────
export const DEFAULT_LABELS = {
  mandal:     'Mandal',
  panchayat:  'Panchayat',
  booth:      'Booth',
  village:    'Village',
  boothName:  'Booth Name',
  caste:      'Caste',
  tag:        'Tag',
  contacts:   'Contacts',
  karyakarta: 'Karyakarta',
  whatsapp:   'WhatsApp No.',
}

// ─── PLAN LIMITS ─────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free:     { vs: 1,  contacts: 1000,     sameLS: false },
  single:   { vs: 1,  contacts: Infinity, sameLS: false },
  multiple: { vs: 12, contacts: Infinity, sameLS: true  },
}

// ─── CONSTITUENCY MASTER ──────────────────────────────────────────────────────
export async function fetchStates() {
  const { data, error } = await supabase
    .from('constituency_master')
    .select('state')
    .eq('active', true)
    .order('state')
  if (error) throw error
  return [...new Set(data.map(r => r.state))]
}

export async function fetchLokSabhas(state) {
  const { data, error } = await supabase
    .from('constituency_master')
    .select('lok_sabha')
    .eq('state', state)
    .eq('active', true)
    .order('lok_sabha')
  if (error) throw error
  return [...new Set(data.map(r => r.lok_sabha))]
}

export async function fetchVidhanSabhas(state, lokSabha) {
  const { data, error } = await supabase
    .from('constituency_master')
    .select('id, vidhan_sabha')
    .eq('state', state)
    .eq('lok_sabha', lokSabha)
    .eq('active', true)
    .order('vidhan_sabha')
  if (error) throw error
  return data  // [{ id, vidhan_sabha }]
}

export async function fetchConstituencyById(id) {
  const { data, error } = await supabase
    .from('constituency_master')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export async function fetchCustomer(authId) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_id', authId)
    .single()
  if (error) throw error
  return data
}

export async function updateCustomerName(customerId, name) {
  const { error } = await supabase
    .from('customers')
    .update({ name })
    .eq('id', customerId)
  if (error) throw error
}

// ─── WORKSPACES ───────────────────────────────────────────────────────────────
export async function fetchWorkspaces(customerId) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('customer_id', customerId)
    .eq('active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createWorkspace({ customerId, constituencyId, state, ls, vs }) {
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      customer_id:      customerId,
      constituency_id:  constituencyId,
      name:             vs,
      state, ls, vs,
    })
    .select()
    .single()
  if (error) throw error

  // Auto-create default settings for this workspace
  await supabase.from('settings').insert({
    workspace_id:  data.id,
    state, ls, vs,
    mandals:   [{ name: 'Default Mandal', panchayats: ['Default Panchayat'] }],
    castes:    ['Yadav','Brahmin','Kurmi','Bhumihar','Rajput','Muslim','Koeri','Dusadh'],
    parties:   ['BJP+','Congress+','Others+'],
    elections: ['Election 2015','Election 2020','Election 2024'],
    labels:    DEFAULT_LABELS,
  })

  return data
}

export async function deactivateWorkspace(workspaceId) {
  const { error } = await supabase
    .from('workspaces')
    .update({ active: false })
    .eq('id', workspaceId)
  if (error) throw error
}

// ─── WORKSPACE STATS ─────────────────────────────────────────────────────────
export async function fetchWorkspaceStats(workspaceId) {
  const [
    { count: contactCount },
    { count: boothCount },
    { data: settingsArr },
    { data: booths },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count:'exact', head:true }).eq('workspace_id', workspaceId),
    supabase.from('booths').select('*', { count:'exact', head:true }).eq('workspace_id', workspaceId),
    supabase.from('settings').select('total_voters,total_booths,mandals').eq('workspace_id', workspaceId).limit(1),
    supabase.from('booths').select('rating').eq('workspace_id', workspaceId).not('rating', 'is', null),
  ])

  const settings = settingsArr?.[0] || {}
  const ratings  = { A: 0, B: 0, C: 0 }
  ;(booths || []).forEach(b => { if (b.rating) ratings[b.rating]++ })

  return {
    contacts: contactCount || 0,
    booths:   boothCount   || 0,
    voters:   settings.total_voters || '—',
    mandals:  settings.mandals?.length || 0,
    ratings,
    dominantRating: Object.entries(ratings).sort((a,b) => b[1]-a[1])[0]?.[0] || null,
  }
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export async function fetchSettings(workspaceId) {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .limit(1)
  if (error) throw error
  if (!data || data.length === 0) return dbToSettings({})
  return dbToSettings(data[0])
}

export async function saveSettings(settings, workspaceId) {
  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .eq('workspace_id', workspaceId)
    .limit(1)
    .single()

  const row = { ...settingsToDb(settings), workspace_id: workspaceId }
  if (existing) {
    const { error } = await supabase.from('settings').update(row).eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('settings').insert(row)
    if (error) throw error
  }
}

// ─── CONTACTS ────────────────────────────────────────────────────────────────
export async function fetchContacts(workspaceId) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(dbToContact)
}

export async function insertContact(contact, workspaceId) {
  const { data, error } = await supabase
    .from('contacts')
    .insert({ ...contactToDb(contact), workspace_id: workspaceId })
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

export async function bulkDeleteContacts(ids) {
  const { error } = await supabase.from('contacts').delete().in('id', ids)
  if (error) throw error
}

// ─── BOOTHS ──────────────────────────────────────────────────────────────────
export async function fetchBooths(workspaceId) {
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('bno', { ascending: true })
  if (error) throw error
  return data.map(dbToBooth)
}

export async function insertBooth(booth, workspaceId) {
  const { data, error } = await supabase
    .from('booths')
    .insert({ ...boothToDb(booth), workspace_id: workspaceId })
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

export async function upsertBoothByBno(boothData, workspaceId) {
  const { data, error } = await supabase
    .from('booths')
    .upsert(
      { ...boothToDb(boothData), workspace_id: workspaceId },
      { onConflict: 'workspace_id,bno' }   // ← per-workspace unique now
    )
    .select()
    .single()
  if (error) throw error
  return dbToBooth(data)
}

// ─── VOLUNTEERS ───────────────────────────────────────────────────────────────
// (Kept for future use — volunteers will be separate users in a later phase)
export async function fetchVolunteers(workspaceId) { return [] }
export async function addVolunteer()               { return null }
export async function removeVolunteer()            {}

// ─── MAPPERS ─────────────────────────────────────────────────────────────────
function dbToSettings(d) {
  return {
    state:       d.state        || 'Bihar',
    ls:          d.ls           || 'Patna Sahib',
    vs:          d.vs           || 'Bankipur',
    totalVoters: d.total_voters || '',
    totalBooths: d.total_booths || '',
    mandals:     d.mandals      || [],
    castes:      d.castes       || [],
    parties:     d.parties      || ['BJP+','Congress+','Others+'],
    elections:   d.elections    || ['Election 2015','Election 2020','Election 2024'],
    adminPin:    d.admin_pin    || '1234',
    sheetsUrl:   d.sheets_url   || '',
    labels:      { ...DEFAULT_LABELS, ...(d.labels || {}) },
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
    labels:       s.labels || DEFAULT_LABELS,
  }
}

function dbToContact(d) {
  return {
    id: d.id, name: d.name||'', phone: d.phone||'', wa: d.wa||'',
    mandal: d.mandal||'', panchayat: d.panchayat||'', village: d.village||'',
    bno: d.bno||'', bnm: d.bnm||'', tag: d.tag||'', caste: d.caste||'',
    gender: d.gender||'', notes: d.notes||'',
  }
}

function contactToDb(c) {
  return {
    name: c.name, phone: c.phone, wa: c.wa||'',
    mandal: c.mandal||'', panchayat: c.panchayat||'', village: c.village||'',
    bno: c.bno||'', bnm: c.bnm||'', tag: c.tag||'', caste: c.caste||'',
    gender: c.gender||'', notes: c.notes||'',
  }
}

function dbToBooth(d) {
  return {
    id: d.id, bno: d.bno||'', bnm: d.bnm||'',
    mandal: d.mandal||'', panchayat: d.panchayat||'',
    voters: d.voters||0, rating: d.rating||'',
    castes: d.castes||['','',''],
    elec:   d.elec||[{cast:0,votes:[0,0,0]},{cast:0,votes:[0,0,0]},{cast:0,votes:[0,0,0]}],
    notes:  d.notes||'',
  }
}

function boothToDb(b) {
  return {
    bno: b.bno, bnm: b.bnm||'', mandal: b.mandal||'', panchayat: b.panchayat||'',
    voters: b.voters||0, rating: b.rating||'',
    castes: b.castes||['','',''], elec: b.elec||[], notes: b.notes||'',
  }
}

// ─── SUPER ADMIN FUNCTIONS ────────────────────────────────────────────────────
// These query across all customers — only callable by super admin

export async function adminFetchAllCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function adminFetchCustomerWorkspaces(customerId) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('customer_id', customerId)
    .eq('active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function adminUpdateCustomerPlan(customerId, plan) {
  const { error } = await supabase
    .from('customers')
    .update({ plan })
    .eq('id', customerId)
  if (error) throw error
}

export async function adminDeleteWorkspace(workspaceId) {
  // Delete child records first (in case CASCADE not set)
  await supabase.from('settings').delete().eq('workspace_id', workspaceId)
  await supabase.from('contacts').delete().eq('workspace_id', workspaceId)
  await supabase.from('booths').delete().eq('workspace_id', workspaceId)
  const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId)
  if (error) throw error
}

export async function adminPurgeCustomer(customerId) {
  // Get all workspaces first
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('customer_id', customerId)

  // Delete all workspace data
  for (const ws of workspaces || []) {
    await supabase.from('settings').delete().eq('workspace_id', ws.id)
    await supabase.from('contacts').delete().eq('workspace_id', ws.id)
    await supabase.from('booths').delete().eq('workspace_id', ws.id)
  }
  await supabase.from('workspaces').delete().eq('customer_id', customerId)
  const { error } = await supabase.from('customers').delete().eq('id', customerId)
  if (error) throw error
}

export async function adminFetchWorkspaceContactCount(workspaceId) {
  const { count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
  return count || 0
}
