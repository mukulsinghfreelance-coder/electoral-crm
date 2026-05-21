export const TAGS = [
  'Key Voter', 'Karyakarta', 'Supporter', 'Opponent',
  'Champion', 'Partner', 'Padadhikari', 'Neutral'
]

export const TAG_STYLE = {
  'Key Voter':    { bg: '#EEEDFE', cl: '#3C3489' },
  'Karyakarta':  { bg: '#E1F5EE', cl: '#085041' },
  'Supporter':   { bg: '#EAF3DE', cl: '#27500A' },
  'Opponent':    { bg: '#FCEBEB', cl: '#791F1F' },
  'Champion':    { bg: '#FAEEDA', cl: '#633806' },
  'Partner':     { bg: '#E6F1FB', cl: '#0C447C' },
  'Padadhikari': { bg: '#FBEAF0', cl: '#72243E' },
  'Neutral':     { bg: '#F1EFE8', cl: '#444441' },
}

export const RATING_STYLE = {
  A: { bg: '#EAF3DE', cl: '#27500A' },
  B: { bg: '#FAEEDA', cl: '#633806' },
  C: { bg: '#FCEBEB', cl: '#791F1F' },
}

export const INIT_SETTINGS = {
  state: 'Bihar',
  ls: 'Patna Sahib',
  vs: 'Bankipur',
  totalVoters: '',
  totalBooths: '',
  mandals: [
    { name: 'Patna Sadar', panchayats: ['Gaighat', 'Rampur'] },
    { name: 'Danapur',     panchayats: ['Khagaul', 'Dinapur'] },
    { name: 'Bikram',      panchayats: ['Naubatpur', 'Bihta'] },
    { name: 'Phulwari',    panchayats: ['Shahpur', 'Maner'] },
  ],
  castes: ['Yadav', 'Brahmin', 'Kurmi', 'Bhumihar', 'Rajput', 'Muslim', 'Koeri', 'Dusadh'],
  parties: ['BJP+', 'Congress+', 'Others+'],
  elections: ['Election 2015', 'Election 2020', 'Election 2024'],
  adminPin: '1234',
  sheetsUrl: '',
}

export const INIT_CONTACTS = [
  { id:1, name:'Ramesh Kumar',  phone:'9876543210', wa:'9876543210', mandal:'Patna Sadar', panchayat:'Gaighat',  village:'',           bno:'42', bnm:'Primary School Gaighat', tag:'Karyakarta',  caste:'Yadav',    notes:'Active worker' },
  { id:2, name:'Sunita Devi',   phone:'9123456780', wa:'',           mandal:'Patna Sadar', panchayat:'Gaighat',  village:'Sarai',       bno:'42', bnm:'Primary School Gaighat', tag:'Key Voter',   caste:'Brahmin',  notes:'' },
  { id:3, name:'Ajay Singh',    phone:'9988776655', wa:'9988776655', mandal:'Danapur',      panchayat:'Khagaul', village:'',            bno:'7',  bnm:'Govt Middle School',      tag:'Champion',    caste:'Rajput',   notes:'Ward president' },
  { id:4, name:'Priya Sharma',  phone:'9012345678', wa:'',           mandal:'Danapur',      panchayat:'Khagaul', village:'Bela',        bno:'7',  bnm:'Govt Middle School',      tag:'Supporter',   caste:'Kurmi',    notes:'' },
  { id:5, name:'Mohan Yadav',   phone:'8765432190', wa:'8765432190', mandal:'Bikram',       panchayat:'Naubatpur',village:'',           bno:'15', bnm:'Community Hall',          tag:'Padadhikari', caste:'Yadav',    notes:'Panchayat head' },
  { id:6, name:'Geeta Kumari',  phone:'9871234560', wa:'',           mandal:'Bikram',       panchayat:'Naubatpur',village:'',           bno:'15', bnm:'Community Hall',          tag:'Key Voter',   caste:'Koeri',    notes:'' },
  { id:7, name:'Rakesh Paswan', phone:'9345678901', wa:'9345678901', mandal:'Phulwari',     panchayat:'Shahpur', village:'Paswan Tola', bno:'23', bnm:'High School Shahpur',     tag:'Karyakarta',  caste:'Dusadh',   notes:'' },
  { id:8, name:'Anita Gupta',   phone:'9654321087', wa:'',           mandal:'Phulwari',     panchayat:'Shahpur', village:'',            bno:'23', bnm:'High School Shahpur',     tag:'Opponent',    caste:'Bhumihar', notes:'Teacher' },
]

export const INIT_BOOTHS = [
  { id:1, bno:'42', bnm:'Primary School Gaighat', mandal:'Patna Sadar', panchayat:'Gaighat',   voters:1240, rating:'A', castes:['Yadav','Brahmin','Kurmi'],  elec:[{cast:980, votes:[420,310,200]},{cast:1020,votes:[460,290,230]},{cast:1100,votes:[510,310,240]}], notes:'Strong booth' },
  { id:2, bno:'7',  bnm:'Govt Middle School',      mandal:'Danapur',     panchayat:'Khagaul',   voters:980,  rating:'B', castes:['Bhumihar','Rajput',''],     elec:[{cast:750, votes:[280,320,120]},{cast:790, votes:[300,310,150]},{cast:820, votes:[330,340,110]}], notes:'Competitive' },
  { id:3, bno:'15', bnm:'Community Hall',           mandal:'Bikram',      panchayat:'Naubatpur', voters:1450, rating:'C', castes:['Muslim','Yadav',''],        elec:[{cast:1100,votes:[210,620,240]},{cast:1150,votes:[230,680,200]},{cast:1200,votes:[240,710,210]}], notes:'Tough seat' },
  { id:4, bno:'23', bnm:'High School Shahpur',      mandal:'Phulwari',    panchayat:'Shahpur',   voters:870,  rating:'A', castes:['Kurmi','Koeri','Rajput'],   elec:[{cast:680, votes:[380,180,100]},{cast:700, votes:[400,170,100]},{cast:740, votes:[430,180,100]}], notes:'Reliable win' },
]

export const APPS_SCRIPT = `// Electoral CRM — Google Apps Script
// Deploy: Extensions → Apps Script → Deploy → New deployment
// Type: Web App | Execute as: Me | Access: Anyone

const SHEET_NAME = "Contacts";
const COLS = ["Timestamp","Name","Phone","WhatsApp","Mandal","Panchayat","Village","BoothNo","BoothName","Tag","Caste","Notes"];

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const [header, ...data] = rows;
  const result = data.map(row => {
    const obj = {};
    header.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(COLS);
    const body = JSON.parse(e.postData.contents);
    if (body.action === "add") {
      sheet.appendRow([
        new Date().toISOString(),
        body.name||"", body.phone||"", body.wa||"",
        body.mandal||"", body.panchayat||"", body.village||"",
        body.bno||"", body.bnm||"", body.tag||"",
        body.caste||"", body.notes||""
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ status: "ok" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`
