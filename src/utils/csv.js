import { TAGS } from '../constants/data'

export function exportContactsCSV(contacts) {
  const rows = [
    ['Name','Phone','WhatsApp','Mandal','Panchayat','Village','BoothNo','BoothName','Tag','Caste','Notes']
  ]
  contacts.forEach(c => rows.push([
    c.name, c.phone, c.wa, c.mandal, c.panchayat,
    c.village, c.bno, c.bnm, c.tag, c.caste, c.notes
  ]))
  downloadCSV(rows, 'contacts.csv')
}

export function parseContactsCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  const start = lines[0].toLowerCase().includes('name') ? 1 : 0
  return lines.slice(start).map(ln => {
    const c = ln.split(',').map(v => v.replace(/^"|"$/g, '').trim())
    return {
      name: c[0] || '',
      phone: c[1] || '',
      wa: c[2] || '',
      mandal: c[3] || '',
      panchayat: c[4] || '',
      village: c[5] || '',
      bno: c[6] || '',
      bnm: c[7] || '',
      tag: TAGS.includes(c[8]) ? c[8] : '',
      caste: c[9] || '',
      notes: c[10] || '',
    }
  }).filter(c => c.name)
}

function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(',')).join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = filename
  a.click()
}
