import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  fetchSettings, saveSettings,
  fetchContacts, insertContact, updateContact, deleteContact,
  fetchBooths, insertBooth, updateBooth, deleteBooth, upsertBoothByBno,
} from "./lib/supabase";
import { SheetsModal } from "./components/SheetsModal";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const TAGS = ["Key Voter","Karyakarta","Supporter","Opponent","Champion","Partner","Padadhikari","Neutral"];
const TAG_STYLE = {
  "Key Voter":   {bg:"#EDE9FE",cl:"#5B21B6"}, "Karyakarta": {bg:"#D1FAE5",cl:"#065F46"},
  "Supporter":   {bg:"#DCFCE7",cl:"#166534"}, "Opponent":   {bg:"#FEE2E2",cl:"#991B1B"},
  "Champion":    {bg:"#FEF3C7",cl:"#92400E"}, "Partner":    {bg:"#DBEAFE",cl:"#1E40AF"},
  "Padadhikari": {bg:"#FCE7F3",cl:"#9D174D"}, "Neutral":    {bg:"#F3F4F6",cl:"#374151"},
};
const RATING = { A:{bg:"#D1FAE5",cl:"#065F46",label:"Wins"}, B:{bg:"#FEF3C7",cl:"#92400E",label:"Mediocre"}, C:{bg:"#FEE2E2",cl:"#991B1B",label:"Loses"} };
const DEFAULT_SETTINGS = {
  state:"Bihar", ls:"Patna Sahib", vs:"Bankipur", totalVoters:"", totalBooths:"",
  mandals:[
    {name:"Patna Sadar",panchayats:["Gaighat","Rampur"]},
    {name:"Danapur",panchayats:["Khagaul","Dinapur"]},
    {name:"Bikram",panchayats:["Naubatpur","Bihta"]},
    {name:"Phulwari",panchayats:["Shahpur","Maner"]},
  ],
  castes:["Yadav","Brahmin","Kurmi","Bhumihar","Rajput","Muslim","Koeri","Dusadh"],
  parties:["BJP+","Congress+","Others+"],
  elections:["Election 2015","Election 2020","Election 2024"],
  adminPin:"1234", sheetsUrl:"",
};

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  primary:"#4F46E5", primaryDark:"#3730A3", primaryLight:"#EEF2FF",
  success:"#059669", successLight:"#D1FAE5",
  amber:"#D97706",   amberLight:"#FEF3C7",
  red:"#DC2626",     redLight:"#FEE2E2",
  teal:"#0D9488",    tealLight:"#CCFBF1", boothDark:"#0F766E",
  gray50:"#F9FAFB",  gray100:"#F3F4F6", gray200:"#E5E7EB",
  gray400:"#9CA3AF", gray600:"#4B5563", gray900:"#111827",
  white:"#FFFFFF",
};

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
const Badge = ({tag}) => { const s=TAG_STYLE[tag]||{bg:C.gray100,cl:C.gray600}; return <span style={{background:s.bg,color:s.cl,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{tag}</span>; };
const RBadge = ({r}) => { if(!r)return null; const s=RATING[r]; return <span style={{background:s.bg,color:s.cl,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{r} · {s.label}</span>; };

const Inp = ({err,style={},booth=false,...p}) => (
  <input {...p} style={{width:"100%",padding:"9px 12px",fontSize:13,border:`1.5px solid ${err?"#EF4444":booth?C.teal+"66":C.gray200}`,borderRadius:9,background:C.white,color:C.gray900,outline:"none",transition:"border .15s",fontFamily:"inherit",...style}}/>
);
const Sel = ({err,children,booth=false,...p}) => (
  <select {...p} style={{width:"100%",padding:"9px 12px",fontSize:13,border:`1.5px solid ${err?"#EF4444":booth?C.teal+"66":C.gray200}`,borderRadius:9,background:C.white,color:C.gray900,outline:"none",fontFamily:"inherit"}}>
    {children}
  </select>
);
const Fld = ({label,req,err,children,col="1/-1"}) => (
  <div style={{gridColumn:col,marginBottom:4}}>
    <label style={{display:"block",fontSize:10,fontWeight:700,color:C.gray400,marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>
      {label}{req&&<span style={{color:C.red,marginLeft:2}}>*</span>}
    </label>
    {children}
    {err&&<div style={{fontSize:10,color:C.red,marginTop:3,fontWeight:500}}>⚠ {err}</div>}
  </div>
);


function Btn({children,onClick,v="default",disabled=false,style={},title=""}) {
  const styles={
    primary:  {background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,color:C.white,border:"none",boxShadow:"0 4px 14px rgba(79,70,229,.35)"},
    success:  {background:`linear-gradient(135deg,${C.success},#047857)`,color:C.white,border:"none",boxShadow:"0 4px 14px rgba(5,150,105,.3)"},
    teal:     {background:`linear-gradient(135deg,${C.teal},${C.boothDark})`,color:C.white,border:"none",boxShadow:"0 4px 14px rgba(13,148,136,.3)"},
    danger:   {background:C.redLight,color:C.red,border:`1px solid #FECACA`},
    ghost:    {background:C.gray100,color:C.gray600,border:`1px solid ${C.gray200}`},
    outline:  {background:C.white,color:C.primary,border:`1.5px solid ${C.primary}`},
    outTeal:  {background:C.white,color:C.teal,border:`1.5px solid ${C.teal}`},
  };
  return (
    <button title={title} onClick={onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 18px",fontSize:13,fontWeight:700,borderRadius:10,cursor:disabled?"not-allowed":"pointer",transition:"all .15s",fontFamily:"inherit",opacity:disabled?.6:1,whiteSpace:"nowrap",...styles[v],...style}}>
      {children}
    </button>
  );
}

function Modal({open,onClose,title,children,wide=false}) {
  if(!open)return null;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(17,24,39,.6)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:1000,padding:"30px 16px",overflowY:"auto",backdropFilter:"blur(3px)"}}>
      <div className="modal-inner" style={{background:C.white,borderRadius:18,boxShadow:"0 24px 64px rgba(0,0,0,.18)",padding:"24px 26px",width:wide?640:450,maxHeight:"90vh",overflowY:"auto",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <span style={{fontSize:17,fontWeight:800,color:C.gray900}}>{title}</span>
          <button onClick={onClose} style={{background:C.gray100,border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",color:C.gray600}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const SortArrow = ({col,sort,onSort,booth=false}) => {
  const a=sort.col===col;
  return <span onClick={()=>onSort(col)} style={{cursor:"pointer",marginLeft:3,color:a?booth?C.teal:C.primary:C.gray400,fontSize:10,userSelect:"none",fontWeight:700}}>{a?(sort.dir==="asc"?"▲":"▼"):"⇅"}</span>;
};

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen({message}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:760,gap:16,background:C.white,borderRadius:18,border:`1px solid ${C.gray200}`}}>
      <div style={{fontSize:40}}>📋</div>
      <div style={{fontSize:16,fontWeight:800,color:C.gray900}}>ContactBook</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:C.primary,animation:"pulse 1s infinite"}}/>
        <span style={{fontSize:13,color:C.gray600,fontWeight:500}}>{message||"Loading…"}</span>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

function ErrorScreen({message,onRetry}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:760,gap:16,background:C.white,borderRadius:18,border:`1px solid ${C.gray200}`,padding:40,textAlign:"center"}}>
      <div style={{fontSize:40}}>❌</div>
      <div style={{fontSize:16,fontWeight:800,color:C.red}}>Failed to connect to database</div>
      <div style={{fontSize:13,color:C.gray600,maxWidth:340}}>{message}</div>
      <Btn v="primary" onClick={onRetry}>🔄 Retry</Btn>
    </div>
  );
}

// ─── OTP MODAL ────────────────────────────────────────────────────────────────
function OTPModal({open,onClose,onSuccess,pin}) {
  const [v,setV]=useState(""); const [err,setErr]=useState("");
  const go=()=>{if(v===pin){setV("");setErr("");onSuccess();}else setErr("Incorrect PIN. Try again.");};
  return (
    <Modal open={open} onClose={()=>{setV("");setErr("");onClose();}} title="🔐 Admin Access Required">
      <p style={{fontSize:13,color:C.gray600,marginBottom:16}}>Enter the Admin PIN to continue.</p>
      <Fld label="Admin PIN" req err={err}><Inp type="password" value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Enter PIN" autoFocus/></Fld>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
        <Btn v="ghost" onClick={()=>{setV("");setErr("");onClose();}}>Cancel</Btn>
        <Btn v="primary" onClick={go}>✓ Verify</Btn>
      </div>
    </Modal>
  );
}

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────
function ContactForm({open,onClose,initial,settings,onSave,saving}) {
  const blank={name:"",phone:"",wa:"",mandal:"",panchayat:"",village:"",bno:"",bnm:"",tag:"",caste:"",notes:""};
  const [f,setF]=useState(blank); const [errs,setErrs]=useState({});
  useEffect(()=>{if(open){setF(initial||blank);setErrs({});}}, [open]);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const panchs=settings.mandals.find(m=>m.name===f.mandal)?.panchayats||[];
  const validate=()=>{
    const e={};
    if(!f.name.trim())e.name="Required"; if(!f.phone.trim())e.phone="Required";
    else if(!/^\d{10}$/.test(f.phone.trim()))e.phone="Must be 10 digits";
    if(f.wa&&!/^\d{10}$/.test(f.wa.trim()))e.wa="10 digits only";
    if(!f.mandal)e.mandal="Required"; if(!f.panchayat)e.panchayat="Required";
    if(!f.tag)e.tag="Required"; if(!f.caste)e.caste="Required";
    if(f.bno&&!/^\d+$/.test(f.bno))e.bno="Numeric only";
    setErrs(e); return Object.keys(e).length===0;
  };
  const submit=()=>{if(!validate())return; onSave(f);};
  return (
    <Modal open={open} onClose={onClose} title={initial?"✏️ Edit Contact":"🙋 Add New Contact"}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 14px"}}>
        <Fld label="Full Name" req err={errs.name}><Inp value={f.name} onChange={set("name")} error={errs.name} placeholder="e.g. Ramesh Kumar"/></Fld>
        <div/>
        <Fld label="Phone" req err={errs.phone} col="1"><Inp value={f.phone} onChange={set("phone")} maxLength={10} error={errs.phone} placeholder="10-digit mobile"/></Fld>
        <Fld label="WhatsApp No." err={errs.wa} col="2"><Inp value={f.wa} onChange={set("wa")} maxLength={10} error={errs.wa} placeholder="optional"/></Fld>
        <Fld label="Mandal" req err={errs.mandal} col="1">
          <Sel value={f.mandal} onChange={e=>setF(p=>({...p,mandal:e.target.value,panchayat:""}))} error={errs.mandal}>
            <option value="">— Select Mandal —</option>
            {settings.mandals.map(m=><option key={m.name}>{m.name}</option>)}
          </Sel>
        </Fld>
        <Fld label="Panchayat" req err={errs.panchayat} col="2">
          <Sel value={f.panchayat} onChange={set("panchayat")} error={errs.panchayat} disabled={!f.mandal}>
            <option value="">— Select Panchayat —</option>
            {panchs.map(p=><option key={p}>{p}</option>)}
          </Sel>
        </Fld>
        <Fld label="Village" col="1"><Inp value={f.village} onChange={set("village")} placeholder="optional"/></Fld>
        <Fld label="Caste" req err={errs.caste} col="2">
          <Sel value={f.caste} onChange={set("caste")} error={errs.caste}>
            <option value="">— Select Caste —</option>
            {settings.castes.map(c=><option key={c}>{c}</option>)}
          </Sel>
        </Fld>
        <Fld label="Booth No." err={errs.bno} col="1"><Inp value={f.bno} onChange={e=>setF(p=>({...p,bno:e.target.value.replace(/\D/g,"")}))} error={errs.bno} placeholder="numeric"/></Fld>
        <Fld label="Booth Name" col="2"><Inp value={f.bnm} onChange={set("bnm")} placeholder="optional"/></Fld>
        <Fld label="Tag" req err={errs.tag}>
          <Sel value={f.tag} onChange={set("tag")} error={errs.tag}>
            <option value="">— Select Tag —</option>
            {TAGS.map(t=><option key={t}>{t}</option>)}
          </Sel>
        </Fld>
        <Fld label="Notes">
          <textarea value={f.notes} onChange={set("notes")} placeholder="Any notes…" style={{width:"100%",padding:"9px 12px",fontSize:13,border:`1.5px solid ${C.gray200}`,borderRadius:9,background:C.white,color:C.gray900,resize:"vertical",minHeight:56,fontFamily:"inherit",outline:"none"}}/>
        </Fld>
      </div>
      <div style={{display:"flex",gap:10,marginTop:14}}>
        <Btn v="ghost" onClick={onClose} style={{flex:1}}>Cancel</Btn>
        <Btn v="success" onClick={submit} disabled={saving} style={{flex:2}}>{saving?"⏳ Saving…":"💾 Save Contact"}</Btn>
      </div>
    </Modal>
  );
}

// ─── BOOTH FORM ───────────────────────────────────────────────────────────────
function BoothForm({open,onClose,initial,settings,onSave,existingBooths,saving}) {
  const mk=()=>({bno:"",bnm:"",mandal:"",panchayat:"",voters:"",rating:"",castes:["","",""],elec:[{cast:"",votes:["","",""]},{cast:"",votes:["","",""]},{cast:"",votes:["","",""]}],notes:""});
  const [f,setF]=useState(mk()); const [errs,setErrs]=useState({});
  useEffect(()=>{
    if(open){
      if(initial)setF({...initial,castes:[...initial.castes],elec:initial.elec.map(e=>({cast:String(e.cast||""),votes:e.votes.map(String)}))});
      else setF(mk()); setErrs({});
    }
  },[open]);
  const panchs=settings.mandals.find(m=>m.name===f.mandal)?.panchayats||[];
  const validate=()=>{
    const e={};
    if(!f.bno||!/^\d+$/.test(f.bno))e.bno="Numeric required";
    else{const dup=existingBooths.find(b=>b.bno===f.bno&&b.id!==initial?.id);if(dup)e.bno=`Booth No. ${f.bno} already exists`;}
    if(!f.mandal)e.mandal="Required";
    if(!f.panchayat)e.panchayat="Required";
    setErrs(e); return Object.keys(e).length===0;
  };
  const setElec=(ei,k,v,vi)=>{const elec=[...f.elec];const e={...elec[ei]};if(k==="cast")e.cast=v.replace(/\D/g,"");else{const vs=[...e.votes];vs[vi]=v.replace(/\D/g,"");e.votes=vs;}elec[ei]=e;setF(p=>({...p,elec}));};
  const submit=()=>{
    if(!validate())return;
    onSave({...f,voters:parseInt(f.voters)||0,elec:f.elec.map(e=>({cast:parseInt(e.cast)||0,votes:e.votes.map(v=>parseInt(v)||0)}))});
  };
  const thS={padding:"7px 9px",textAlign:"left",fontSize:10,fontWeight:700,color:C.teal,textTransform:"uppercase",letterSpacing:".05em",background:C.tealLight,borderBottom:`1.5px solid ${C.teal}33`};
  return (
    <Modal open={open} onClose={onClose} title={initial?"✏️ Edit Booth":"📍 Add Booth"} wide>
      <div style={{background:`linear-gradient(135deg,${C.tealLight},#F0FDFA)`,borderRadius:12,padding:"12px 14px",marginBottom:14,borderLeft:`4px solid ${C.teal}`}}>
        <div style={{fontSize:12,fontWeight:700,color:C.boothDark}}>Booth Details — fields marked * are required</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px 14px"}}>
        <Fld label="Booth No." req err={errs.bno} col="1"><Inp value={f.bno} onChange={e=>setF(p=>({...p,bno:e.target.value.replace(/\D/g,"")}))} error={errs.bno} placeholder="numeric" booth/></Fld>
        <Fld label="Booth Name" col="2"><Inp value={f.bnm} onChange={e=>setF(p=>({...p,bnm:e.target.value}))} placeholder="optional" booth/></Fld>
        <Fld label="Booth Rating" col="3"><Sel value={f.rating} onChange={e=>setF(p=>({...p,rating:e.target.value}))} booth><option value="">— Optional —</option><option value="A">A — Generally Wins</option><option value="B">B — Mediocre</option><option value="C">C — Generally Loses</option></Sel></Fld>
        <Fld label="Mandal" req err={errs.mandal} col="1"><Sel value={f.mandal} onChange={e=>setF(p=>({...p,mandal:e.target.value,panchayat:""}))} error={errs.mandal} booth><option value="">— Select —</option>{settings.mandals.map(m=><option key={m.name}>{m.name}</option>)}</Sel></Fld>
        <Fld label="Panchayat" req err={errs.panchayat} col="2"><Sel value={f.panchayat} onChange={e=>setF(p=>({...p,panchayat:e.target.value}))} error={errs.panchayat} disabled={!f.mandal} booth><option value="">— Select —</option>{panchs.map(p=><option key={p}>{p}</option>)}</Sel></Fld>
        <Fld label="Total Voters" col="3"><Inp value={f.voters} onChange={e=>setF(p=>({...p,voters:e.target.value.replace(/\D/g,"")}))} placeholder="e.g. 1200" booth/></Fld>
        {[0,1,2].map(i=>(<Fld key={i} label={`Top Caste ${i+1}`} col={String(i+1)}><Sel value={f.castes[i]} onChange={e=>{const c=[...f.castes];c[i]=e.target.value;setF(p=>({...p,castes:c}));}} booth><option value="">— Select —</option>{settings.castes.map(c=><option key={c}>{c}</option>)}</Sel></Fld>))}
      </div>
      <div
        className="election-history-section"
        style={{marginBottom:12}}
      >
        <div style={{fontSize:12,fontWeight:700,color:C.boothDark,marginBottom:10}}>
          📊 Election History
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr>
              <th style={thS}>Election</th>
              <th style={thS}>Casted Vote</th>
              {settings.parties.map((p,i)=><th key={i} style={thS}>{p}</th>)}
              <th style={{...thS,color:C.primary}}>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {f.elec.map((e,ei)=>{
              const total=e.votes.slice(0,settings.parties.length).reduce((a,v)=>a+(parseInt(v)||0),0);
              const rem=(parseInt(e.cast)||0)-total;
              return(
                <tr key={ei} style={{borderTop:`1px solid ${C.teal}22`}}>
                  <td style={{padding:"5px 8px",color:C.boothDark,fontWeight:600}}>
                    {settings.elections[ei]||`E${ei+1}`}
                  </td>
                  <td style={{padding:"4px 5px"}}>
                    <Inp value={e.cast} onChange={ev=>setElec(ei,"cast",ev.target.value)} style={{padding:"5px 8px",fontSize:12}} booth/>
                  </td>
                  {settings.parties.map((_,pi)=>(
                    <td key={pi} style={{padding:"4px 5px"}}>
                      <Inp value={e.votes[pi]||""} onChange={ev=>setElec(ei,"vote",ev.target.value,pi)} style={{padding:"5px 8px",fontSize:12}} booth/>
                    </td>
                  ))}
                  <td style={{padding:"5px 8px",fontWeight:700,color:rem<0?C.red:C.primary,fontSize:14}}>
                    {rem>=0?rem:"—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Fld label="Notes"><textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Booth-specific notes…" style={{width:"100%",padding:"9px 12px",fontSize:13,border:`1.5px solid ${C.teal}66`,borderRadius:9,background:C.white,resize:"vertical",minHeight:50,fontFamily:"inherit",outline:"none"}}/></Fld>
      <div style={{display:"flex",gap:10,marginTop:14}}>
        <Btn v="ghost" onClick={onClose} style={{flex:1}}>Cancel</Btn>
        <Btn v="teal" onClick={submit} disabled={saving} style={{flex:2}}>{saving?"⏳ Saving…":"💾 Save Booth"}</Btn>
      </div>
    </Modal>
  );
}

// ─── SETTINGS MODAL ───────────────────────────────────────────────────────────
function SettingsModal({open,onClose,settings,onSave,saving}) {
  const [s,setS]=useState(settings); const [selM,setSelM]=useState(0);
  const [nm,setNm]=useState(""); const [np,setNp]=useState(""); const [nc,setNc]=useState("");
  const [npy,setNpy]=useState(""); const [elections,setElections]=useState([...settings.elections]);
  const [tab,setTab]=useState("geo"); const [newPin,setNewPin]=useState("");
  useEffect(()=>{if(open){setS({...settings});setElections([...settings.elections]);setSelM(0);}},[open]);
  const save=()=>onSave({...s,elections});
  const addM=()=>{const n=nm.trim();if(!n||s.mandals.find(m=>m.name===n))return;setS(p=>({...p,mandals:[...p.mandals,{name:n,panchayats:[]}]}));setNm("");setSelM(s.mandals.length);};
  const remM=i=>{const m=[...s.mandals];m.splice(i,1);setS(p=>({...p,mandals:m}));setSelM(0);};
  const addP=()=>{const n=np.trim();if(!n||!s.mandals[selM])return;const m=[...s.mandals];if(!m[selM].panchayats.includes(n))m[selM]={...m[selM],panchayats:[...m[selM].panchayats,n]};setS(p=>({...p,mandals:m}));setNp("");};
  const remP=(mi,pi)=>{const m=[...s.mandals];m[mi]={...m[mi],panchayats:m[mi].panchayats.filter((_,i)=>i!==pi)};setS(p=>({...p,mandals:m}));};
  const TABS=[["geo","🗺️ Geography"],["castes","👥 Castes"],["parties","🏛️ Parties"],["admin","🔐 Admin"]];
  return (
    <Modal open={open} onClose={onClose} title="⚙️ Settings (Admin)" wide>
      <div style={{display:"flex",gap:0,marginBottom:18,borderBottom:`2px solid ${C.gray200}`}}>
        {TABS.map(([k,v])=>(<button key={k} onClick={()=>setTab(k)} style={{border:"none",background:"none",padding:"8px 14px",fontSize:12,fontWeight:tab===k?700:500,color:tab===k?C.primary:C.gray400,borderBottom:tab===k?`2.5px solid ${C.primary}`:"2.5px solid transparent",cursor:"pointer",marginBottom:-2,fontFamily:"inherit"}}>{v}</button>))}
      </div>
      {tab==="geo"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div>
          <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Mandals</div>
          <div style={{border:`1.5px solid ${C.gray200}`,borderRadius:10,overflow:"hidden",maxHeight:180,overflowY:"auto",marginBottom:8}}>
            {s.mandals.map((m,i)=>(<div key={i} onClick={()=>setSelM(i)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",fontSize:13,background:selM===i?C.primaryLight:"transparent",cursor:"pointer",borderBottom:`1px solid ${C.gray100}`}}><span style={{fontWeight:selM===i?700:400,color:selM===i?C.primary:"inherit"}}>{m.name}</span><button onClick={e=>{e.stopPropagation();remM(i);}} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:13}}>✕</button></div>))}
            {s.mandals.length===0&&<div style={{padding:12,color:C.gray400,fontSize:12}}>No mandals yet</div>}
          </div>
          <div style={{display:"flex",gap:6}}><Inp value={nm} onChange={e=>setNm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addM()} placeholder="New mandal name…"/><Btn v="primary" onClick={addM} style={{padding:"9px 14px"}}>+</Btn></div>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Panchayats in <span style={{color:C.primary}}>{s.mandals[selM]?.name||"—"}</span></div>
          <div style={{border:`1.5px solid ${C.gray200}`,borderRadius:10,overflow:"hidden",maxHeight:180,overflowY:"auto",marginBottom:8}}>
            {(s.mandals[selM]?.panchayats||[]).map((p,pi)=>(<div key={pi} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",fontSize:13,borderBottom:`1px solid ${C.gray100}`}}>{p}<button onClick={()=>remP(selM,pi)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:13}}>✕</button></div>))}
            {(s.mandals[selM]?.panchayats||[]).length===0&&<div style={{padding:12,color:C.gray400,fontSize:12}}>No panchayats</div>}
          </div>
          <div style={{display:"flex",gap:6}}><Inp value={np} onChange={e=>setNp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addP()} placeholder="New panchayat…"/><Btn v="primary" onClick={addP} style={{padding:"9px 14px"}}>+</Btn></div>
        </div>
      </div>)}
      {tab==="castes"&&(<div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
          {s.castes.map((c,i)=>(<span key={i} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",background:C.gray100,borderRadius:20,fontSize:12,fontWeight:500}}>{c}<button onClick={()=>setS(p=>({...p,castes:p.castes.filter(x=>x!==c)}))} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:12}}>✕</button></span>))}
        </div>
        <div style={{display:"flex",gap:6}}><Inp value={nc} onChange={e=>setNc(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nc.trim()&&!s.castes.includes(nc.trim())){setS(p=>({...p,castes:[...p.castes,nc.trim()]}));setNc("");}}} placeholder="Add caste…"/><Btn v="primary" onClick={()=>{const n=nc.trim();if(n&&!s.castes.includes(n)){setS(p=>({...p,castes:[...p.castes,n]}));setNc("");}}} style={{whiteSpace:"nowrap"}}>+ Add</Btn></div>
      </div>)}
      {tab==="parties"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div>
          <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Party alliances (max 3)</div>
          {s.parties.map((p,i)=>(<div key={i} style={{display:"flex",gap:6,marginBottom:8}}><Inp value={p} onChange={e=>{const ps=[...s.parties];ps[i]=e.target.value;setS(prev=>({...prev,parties:ps}));}}/><button onClick={()=>setS(prev=>({...prev,parties:prev.parties.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:16}}>✕</button></div>))}
          {s.parties.length<3&&<div style={{display:"flex",gap:6}}><Inp value={npy} onChange={e=>setNpy(e.target.value)} placeholder="Add party…"/><Btn v="primary" onClick={()=>{const n=npy.trim();if(n&&s.parties.length<3){setS(p=>({...p,parties:[...p.parties,n]}));setNpy("");}}} style={{padding:"9px 14px"}}>+</Btn></div>}
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>Election names</div>
          {elections.map((e,i)=>(<div key={i} style={{marginBottom:8}}><div style={{fontSize:10,color:C.gray400,fontWeight:600,marginBottom:4}}>E{i+1} {i===0?"(oldest)":i===2?"(latest)":""}</div><Inp value={e} onChange={ev=>{const el=[...elections];el[i]=ev.target.value;setElections(el);}}/></div>))}
        </div>
      </div>)}
      {tab==="admin"&&(<div>
        <div style={{background:"#FEF3C7",borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:12,color:"#92400E",fontWeight:500}}>⚠️ Simulated PIN. Integrate real SMS OTP for production.</div>
        <Fld label="New Admin PIN (4–6 digits)"><Inp type="password" value={newPin} onChange={e=>setNewPin(e.target.value)} placeholder="Enter new PIN"/></Fld>
        <Btn v="primary" onClick={()=>{if(newPin.length>=4){setS(p=>({...p,adminPin:newPin}));alert("PIN updated!");setNewPin("");}else alert("PIN must be 4+ digits");}}>Update PIN</Btn>
      </div>)}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
        <Btn v="ghost" onClick={onClose}>Cancel</Btn>
        <Btn v="primary" onClick={save} disabled={saving}>{saving?"⏳ Saving…":"✓ Save Settings"}</Btn>
      </div>
    </Modal>
  );
}

// ─── OTHER MODALS ─────────────────────────────────────────────────────────────
function ConstModal({open,onClose,settings,onSave,saving}) {
  const [f,setF]=useState({});
  useEffect(()=>{if(open)setF({state:settings.state,ls:settings.ls,vs:settings.vs,totalVoters:settings.totalVoters||"",totalBooths:settings.totalBooths||""});},[open]);
  return (
    <Modal open={open} onClose={onClose} title="✏️ Edit Constituency Constants">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 14px"}}>
        <Fld label="State" col="1"><Inp value={f.state||""} onChange={e=>setF(p=>({...p,state:e.target.value}))}/></Fld>
        <Fld label="Lok Sabha" col="2"><Inp value={f.ls||""} onChange={e=>setF(p=>({...p,ls:e.target.value}))}/></Fld>
        <Fld label="Vidhan Sabha" col="1"><Inp value={f.vs||""} onChange={e=>setF(p=>({...p,vs:e.target.value}))}/></Fld>
        <Fld label="Total Voters" col="2"><Inp value={f.totalVoters||""} onChange={e=>setF(p=>({...p,totalVoters:e.target.value.replace(/\D/g,"")}))} placeholder="e.g. 250000"/></Fld>
        <Fld label="Total Booths"><Inp value={f.totalBooths||""} onChange={e=>setF(p=>({...p,totalBooths:e.target.value.replace(/\D/g,"")}))} placeholder="e.g. 350"/></Fld>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:14}}>
        <Btn v="ghost" onClick={onClose}>Cancel</Btn>
        <Btn v="primary" onClick={()=>onSave(f)} disabled={saving}>{saving?"⏳ Saving…":"Save"}</Btn>
      </div>
    </Modal>
  );
}

function ImportModal({open,onClose,onImport,saving}) {
  const [txt,setTxt]=useState(""); const ref=useRef();
  return (
    <Modal open={open} onClose={onClose} title="⬆️ Import Contacts">
      <p style={{fontSize:12,color:C.gray600,marginBottom:12}}>Columns: Name, Phone, WhatsApp, Mandal, Panchayat, Village, BoothNo, BoothName, Tag, Caste, Notes</p>
      <Fld label="Paste CSV"><textarea value={txt} onChange={e=>setTxt(e.target.value)} style={{width:"100%",padding:"9px 12px",fontSize:11,fontFamily:"monospace",border:`1.5px solid ${C.gray200}`,borderRadius:9,background:"#FAFAFA",minHeight:80,resize:"vertical",outline:"none"}}/></Fld>
      <input ref={ref} type="file" accept=".csv" style={{marginBottom:12,fontSize:12}} onChange={e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>setTxt(ev.target.result);r.readAsText(file);}}/>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn v="ghost" onClick={onClose}>Cancel</Btn>
        <Btn v="primary" onClick={()=>onImport(txt)} disabled={saving}>{saving?"⏳ Importing…":"Import"}</Btn>
      </div>
    </Modal>
  );
}

function ExcelModal({open,onClose,onImport,saving}) {
  const [txt,setTxt]=useState(""); const ref=useRef();
  const go=()=>{
    const lines=txt.trim().split("\n").map(l=>l.trim()).filter(Boolean);
    const start=lines[0]?.toLowerCase().match(/booth|no/)?1:0;
    const rows=lines.slice(start).map(l=>{const c=l.split(",").map(v=>v.replace(/^"|"$/g,"").trim());return{bno:c[0]||"",bnm:c[1]||"",panchayat:c[2]||"",mandal:c[3]||"",voters:c[4]||""};}).filter(r=>r.bno);
    onImport(rows);
  };
  return (
    <Modal open={open} onClose={onClose} title="📊 Import Booths from Excel / CSV">
      <div style={{background:C.tealLight,borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:12,color:C.boothDark,lineHeight:1.8,fontWeight:500}}>
        <b>CSV columns (in order):</b><br/>
        <code style={{background:"#fff",padding:"2px 6px",borderRadius:4}}>BoothNo, BoothName, Panchayat, Mandal, TotalVoters</code><br/>
        Existing booth numbers → updated | New ones → added
      </div>
      <Fld label="Paste CSV text">
        <textarea value={txt} onChange={e=>setTxt(e.target.value)} style={{width:"100%",padding:"9px 12px",fontSize:12,fontFamily:"monospace",border:`1.5px solid ${C.teal}66`,borderRadius:9,background:"#FAFAFA",minHeight:80,resize:"vertical",outline:"none"}} placeholder="42,Primary School Gaighat,Gaighat,Patna Sadar,1240"/>
      </Fld>
      <input ref={ref} type="file" accept=".csv,.xlsx,.xls" style={{marginBottom:12,fontSize:12}} onChange={e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>setTxt(ev.target.result);r.readAsText(file);}}/>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn v="ghost" onClick={onClose}>Cancel</Btn>
        <Btn v="teal" onClick={go} disabled={saving}>{saving?"⏳ Importing…":"📥 Import Booths"}</Btn>
      </div>
    </Modal>
  );
}

// ─── DETAIL PANELS ────────────────────────────────────────────────────────────
function ContactDetail({contact,settings,onEdit,onDelete}) {
  if(!contact)return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:10,color:C.gray400,padding:30,textAlign:"center"}}><span style={{fontSize:40}}>👆</span><span style={{fontSize:13,fontWeight:500}}>Select a contact</span></div>;
  const s=TAG_STYLE[contact.tag]||{bg:C.gray100,cl:C.gray600};
  const ini=contact.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return(<>
    <div style={{padding:"16px",background:`linear-gradient(135deg,${s.bg},${s.bg}88)`,borderBottom:`1px solid ${C.gray200}`}}>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:s.cl,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>{ini}</div>
        <div><div style={{fontSize:15,fontWeight:800,color:C.gray900}}>{contact.name}</div><div style={{marginTop:4}}><Badge tag={contact.tag}/></div></div>
      </div>
    </div>
    <div style={{padding:"14px 16px",flex:1,overflowY:"auto"}}>
      {[["📞 Phone",contact.phone],["💬 WhatsApp",contact.wa],["🏷️ Caste",contact.caste],["🏘️ Village",contact.village],["🗺️ Mandal",contact.mandal],["🏛️ Panchayat",contact.panchayat],["📍 Booth No.",contact.bno],["🏫 Booth Name",contact.bnm],["📝 Notes",contact.notes]].map(([l,v])=>v?(<div key={l} style={{marginBottom:10}}><div style={{fontSize:10,fontWeight:700,color:C.gray400,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:500,color:C.gray900}}>{v}</div></div>):null)}
    </div>
    <div style={{padding:"12px 14px",borderTop:`1px solid ${C.gray200}`,display:"flex",gap:8}}>
      <Btn v="outline" onClick={()=>onEdit(contact)} style={{flex:1}}>✏️ Edit</Btn>
      <Btn v="danger" onClick={()=>onDelete(contact.id)}>🗑️</Btn>
    </div>
  </>);
}

function BoothDetail({booth,settings,onEdit,onDelete}) {
  if(!booth)return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:10,color:C.gray400,padding:30,textAlign:"center"}}><span style={{fontSize:40}}>📍</span><span style={{fontSize:13,fontWeight:500}}>Select a booth</span></div>;
  const b=booth; const rs=RATING[b.rating]||{bg:C.gray100,cl:C.gray600};
  return(<>
    <div style={{padding:"16px",background:`linear-gradient(135deg,${C.tealLight},#F0FDFA)`,borderBottom:`1px solid ${C.teal}33`}}>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <div style={{width:44,height:44,borderRadius:10,background:b.rating?rs.bg:C.tealLight,border:`2px solid ${C.teal}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:b.rating?rs.cl:C.teal,flexShrink:0}}>{b.rating||"—"}</div>
        <div><div style={{fontSize:15,fontWeight:800,color:C.gray900}}>Booth {b.bno}</div><div style={{fontSize:12,color:C.teal,fontWeight:500,marginTop:2}}>{b.bnm||"—"}</div></div>
      </div>
    </div>
    <div style={{padding:"14px 16px",flex:1,overflowY:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {[["Mandal",b.mandal],["Panchayat",b.panchayat],["Voters",b.voters||"—"],["Rating",b.rating?<RBadge r={b.rating}/>:"—"]].map(([l,v])=>(<div key={l} style={{background:C.tealLight,borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:9,fontWeight:700,color:C.teal,textTransform:"uppercase",letterSpacing:".05em"}}>{l}</div><div style={{fontSize:13,fontWeight:700,color:C.boothDark,marginTop:2}}>{v}</div></div>))}
      </div>
      <div style={{marginBottom:10}}><div style={{fontSize:10,fontWeight:700,color:C.gray400,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>Top Castes</div><div style={{fontSize:13,fontWeight:500}}>{b.castes.filter(Boolean).join(" · ")||"—"}</div></div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,fontWeight:700,color:C.gray400,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Election History</div>
        {b.elec.map((e,ei)=>{const total=(e.votes||[]).reduce((a,v)=>a+(v||0),0);const rem=(e.cast||0)-total;return(<div key={ei} style={{background:C.gray50,borderRadius:8,padding:"8px 10px",marginBottom:6,fontSize:11}}><div style={{fontWeight:700,color:C.boothDark,marginBottom:4}}>{settings.elections[ei]||`E${ei+1}`}</div><div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px"}}><span>Cast: <b>{e.cast||0}</b></span>{settings.parties.map((p,pi)=><span key={pi}>{p}: <b style={{color:C.primary}}>{e.votes?.[pi]||0}</b></span>)}<span>Rem: <b style={{color:rem<0?C.red:C.success}}>{rem>=0?rem:"—"}</b></span></div></div>);})}
      </div>
      {b.notes&&<div><div style={{fontSize:10,fontWeight:700,color:C.gray400,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2}}>Notes</div><div style={{fontSize:13}}>{b.notes}</div></div>}
    </div>
    <div style={{padding:"12px 14px",borderTop:`1px solid ${C.gray200}`,display:"flex",gap:8}}>
      <Btn v="outTeal" onClick={()=>onEdit(b)} style={{flex:1}}>✏️ Edit</Btn>
      <Btn v="danger" onClick={()=>onDelete(b.id)}>🗑️</Btn>
    </div>
  </>);
}

// ─── SIDEBAR ITEM ─────────────────────────────────────────────────────────────
function SBI({icon,label,count,active,onClick,color=C.primary}) {
  return(<div onClick={onClick} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",margin:"1px 6px",borderRadius:9,cursor:"pointer",fontSize:12,fontWeight:active?700:500,color:active?color:C.gray600,background:active?color+"15":"transparent",transition:"all .15s"}}>
    <span style={{fontSize:14}}>{icon}</span>
    <span style={{flex:1}}>{label}</span>
    {count!==undefined&&<span style={{fontSize:10,color:active?color:C.gray400,background:active?color+"22":C.gray100,borderRadius:20,padding:"1px 7px",fontWeight:700}}>{count}</span>}
  </div>);
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({msg,type}) {
  if(!msg)return null;
  const bg=type==="error"?C.red:type==="success"?C.success:C.primary;
  return <div style={{position:"fixed",bottom:24,right:24,background:bg,color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:9999,boxShadow:"0 8px 24px rgba(0,0,0,.2)",maxWidth:320}}>{msg}</div>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [settings,  setSettingsState] = useState(DEFAULT_SETTINGS);
  const [contacts,  setContacts]      = useState([]);
  const [booths,    setBooths]        = useState([]);
  const [loading,   setLoading]       = useState(true);
  const [loadErr,   setLoadErr]       = useState(null);
  const [saving,    setSaving]        = useState(false);
  const [toast,     setToast]         = useState({msg:"",type:"success"});

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast({msg:"",type:"success"}),3000);};

  // Google Sheets
  const [showSheets,  setShowSheets]  = useState(false);
  const [syncStatus,  setSyncStatus]  = useState("");   // "syncing" | "ok" | "error" | ""

  // for Mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
// end for mobile

  // ── Load all data from Supabase on mount ──────────────────────────────────
  const loadAll = useCallback(async()=>{
    setLoading(true); setLoadErr(null);
    try {
      const [s,c,b] = await Promise.all([fetchSettings(), fetchContacts(), fetchBooths()]);
      setSettingsState(s); setContacts(c); setBooths(b);
    } catch(err) {
      setLoadErr(err.message||"Unknown error");
    }
    setLoading(false);
  },[]);

// Google Sheets
// Push a single contact to Google Sheets when it is created
  const syncToSheets = async (contact) => {
     if (!settings.sheetsUrl) return;
     setSyncStatus("syncing");
     try {
        await fetch(settings.sheetsUrl, {
           method: "POST",
           body: JSON.stringify({ action: "add", ...contact }),
           headers: { "Content-Type": "text/plain" },
      });
      setSyncStatus("ok");
      setTimeout(() => setSyncStatus(""), 3000);
      } catch {
        setSyncStatus("error");
        setTimeout(() => setSyncStatus(""), 3000);
      }
   };

// Pull new contacts from Google Sheets into Supabase
const pullFromSheets = async () => {
  if (!settings.sheetsUrl) {
    alert("Configure Google Sheets URL first.\nClick 'Google Sheets' in the sidebar.");
    return;
  }
  setSyncStatus("syncing");
  try {
    const res  = await fetch(settings.sheetsUrl);
    const data = await res.json();
    if (data.status === "ok" && data.data) {
      const TAGS_SET = new Set(TAGS);
      let added = 0;
      for (const row of data.data) {
        const phone = String(row.Phone || "").trim();
        if (!phone) continue;
        // Skip if phone already exists in local contacts state
        if (contacts.find(c => c.phone === phone)) continue;
        try {
          const created = await insertContact({
            name:      row.Name      || "",
            phone,
            wa:        row.WhatsApp  || "",
            mandal:    row.Mandal    || "",
            panchayat: row.Panchayat || "",
            village:   row.Village   || "",
            bno:       row.BoothNo   || "",
            bnm:       row.BoothName || "",
            tag:       TAGS_SET.has(row.Tag) ? row.Tag : "",
            caste:     row.Caste     || "",
            notes:     row.Notes     || "",
          });
          setContacts(cs => [created, ...cs]);
          added++;
        } catch { /* skip duplicates */ }
      }
      setSyncStatus("ok");
      setTimeout(() => setSyncStatus(""), 3000);
      showToast(`✅ Pulled ${added} new contact${added !== 1 ? "s" : ""} from Google Sheets`);
    }
  } catch (err) {
    setSyncStatus("error");
    setTimeout(() => setSyncStatus(""), 3000);
    showToast("Failed to pull from Sheets. Check URL & permissions.", "error");
  }
};

// Save Sheets URL into settings (Supabase)
const handleSaveSheetsUrl = async (url) => {
  try {
    const updated = { ...settings, sheetsUrl: url };
    await saveSettings(updated);
    setSettingsState(updated);
    showToast(url ? "✅ Google Sheets connected!" : "Sheets disconnected");
  } catch (err) {
    showToast("Error saving: " + err.message, "error");
  }
};

  useEffect(()=>{loadAll();},[loadAll]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [screen,    setScreen]    = useState("contacts");
  const [activeTag, setActiveTag] = useState("");
  const [selC,      setSelC]      = useState(null);
  const [selB,      setSelB]      = useState(null);
  const [page,      setPage]      = useState(1); const PS=20;
  const [sort,      setSort]      = useState({col:"name",dir:"asc"});
  const [bSort,     setBSort]     = useState({col:"bno",dir:"asc"});
  const [search,    setSearch]    = useState("");
  const [fM,setFM]=useState(""); const [fP,setFP]=useState(""); const [fB,setFB]=useState(""); const [fT,setFT]=useState(""); const [fCaste,setFCaste]=useState("");
  const [bSearch,setBSearch]=useState(""); const [bfR,setBfR]=useState(""); const [bfP,setBfP]=useState("");
  const [showAdd,    setShowAdd]    = useState(false); const [editC,setEditC]=useState(null);
  const [showBAdd,   setShowBAdd]   = useState(false); const [editB,setEditB]=useState(null);
  const [showSettings,setShowSettings]=useState(false);
  const [showConst,  setShowConst]  = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExcel,  setShowExcel]  = useState(false);
  const [showOTP,    setShowOTP]    = useState(false); const [otpAction,setOtpAction]=useState(null);
  const [isAdmin,    setIsAdmin]    = useState(false);

  const reqAdmin=useCallback(action=>{if(isAdmin){action();return;}setOtpAction(()=>action);setShowOTP(true);},[isAdmin]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const allPanchs=useMemo(()=>[...new Set(settings.mandals.flatMap(m=>m.panchayats))].sort(),[settings]);
  const mandalPanchs=useMemo(()=>fM?settings.mandals.find(m=>m.name===fM)?.panchayats||[]:allPanchs,[fM,settings,allPanchs]);
  const tagCounts=useMemo(()=>{const t={};contacts.forEach(c=>{if(c.tag)t[c.tag]=(t[c.tag]||0)+1;});return t;},[contacts]);
  const boothRatingCounts=useMemo(()=>{const r={A:0,B:0,C:0};booths.forEach(b=>{if(b.rating)r[b.rating]++;});return r;},[booths]);

  const filteredC=useMemo(()=>{
    const q=search.toLowerCase(); const ft=fT||activeTag;
    let r=contacts.filter(c=>{
      const ok=!q||(c.name+c.phone+c.wa+c.mandal+c.panchayat+c.village+c.bno+c.bnm+c.tag+c.caste).toLowerCase().includes(q);
      return ok&&(!fM||c.mandal===fM)&&(!fP||c.panchayat===fP)&&(!fB||c.bno===fB)&&(!ft||c.tag===ft)&&(!fCaste||c.caste===fCaste);
    });
    r.sort((a,b)=>{let av=a[sort.col]||"",bv=b[sort.col]||"";if(sort.col==="bno"){av=parseInt(av)||0;bv=parseInt(bv)||0;return sort.dir==="asc"?av-bv:bv-av;}return sort.dir==="asc"?av.toString().localeCompare(bv.toString()):bv.toString().localeCompare(av.toString());});
    return r;
  },[contacts,search,fM,fP,fB,fT,fCaste,activeTag,sort]);

  const filteredB=useMemo(()=>{
    const q=bSearch.toLowerCase();
    let r=booths.filter(b=>{const ok=!q||(b.bno+b.bnm+(b.mandal||"")+(b.panchayat||"")+b.castes.join(" ")).toLowerCase().includes(q);return ok&&(!bfR||b.rating===bfR)&&(!bfP||b.panchayat===bfP);});
    r.sort((a,b2)=>{let av=a[bSort.col]||"",bv=b2[bSort.col]||"";if(bSort.col==="bno"||bSort.col==="voters"){av=parseInt(av)||0;bv=parseInt(bv)||0;return bSort.dir==="asc"?av-bv:bv-av;}return bSort.dir==="asc"?av.toString().localeCompare(bv.toString()):bv.toString().localeCompare(av.toString());});
    return r;
  },[booths,bSearch,bfR,bfP,bSort]);

  const pages=Math.max(1,Math.ceil(filteredC.length/PS));
  const slice=filteredC.slice((page-1)*PS,page*PS);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSaveContact = async f => {
  setSaving(true);
  try {
    if (editC) {
      // Editing existing contact
      const updated = await updateContact(editC.id, f);
      setContacts(cs => cs.map(c => c.id === updated.id ? updated : c));
      setSelC(updated);
      showToast("Contact updated ✓");
    } else {
      // Adding new contact
      const created = await insertContact(f);
      setContacts(cs => [created, ...cs]);
      setSelC(created);
      showToast("Contact added ✓");
      syncToSheets(created); // fire-and-forget, no await needed
    }
    setShowAdd(false);
    setEditC(null);
  } catch (err) {
    showToast("Error: " + err.message, "error");
  }
  setSaving(false);
};

  const handleDeleteContact=async id=>{
    if(!confirm("Delete this contact?"))return;
    try{await deleteContact(id);setContacts(cs=>cs.filter(c=>c.id!==id));setSelC(null);showToast("Contact deleted");}
    catch(err){showToast("Error: "+err.message,"error");}
  };

  const handleSaveBooth=async f=>{
    setSaving(true);
    try{
      if(editB){const updated=await updateBooth(editB.id,f);setBooths(bs=>bs.map(b=>b.id===updated.id?updated:b));setSelB(updated);showToast("Booth updated ✓");}
      else{const created=await insertBooth(f);setBooths(bs=>[...bs,created]);setSelB(created);showToast("Booth added ✓");}
      setShowBAdd(false);setEditB(null);
    }catch(err){showToast("Error: "+err.message,"error");}
    setSaving(false);
  };

  const handleDeleteBooth=async id=>{
    if(!confirm("Delete this booth?"))return;
    try{await deleteBooth(id);setBooths(bs=>bs.filter(b=>b.id!==id));setSelB(null);showToast("Booth deleted");}
    catch(err){showToast("Error: "+err.message,"error");}
  };

  const handleSaveSettings=async s=>{
    setSaving(true);
    try{await saveSettings(s);setSettingsState(s);setShowSettings(false);showToast("Settings saved ✓");}
    catch(err){showToast("Error: "+err.message,"error");}
    setSaving(false);
  };

  const handleSaveConst=async f=>{
    setSaving(true);
    try{const updated={...settings,...f};await saveSettings(updated);setSettingsState(updated);setShowConst(false);showToast("Constants saved ✓");}
    catch(err){showToast("Error: "+err.message,"error");}
    setSaving(false);
  };

  const handleImport=async txt=>{
    const TAGS_SET=new Set(TAGS);
    const lines=txt.trim().split("\n").map(l=>l.trim()).filter(Boolean);
    const start=lines[0].toLowerCase().includes("name")?1:0;
    const rows=lines.slice(start).map(ln=>{const c=ln.split(",").map(v=>v.replace(/^"|"$/g,"").trim());return{name:c[0],phone:c[1]||"",wa:c[2]||"",mandal:c[3]||"",panchayat:c[4]||"",village:c[5]||"",bno:c[6]||"",bnm:c[7]||"",tag:TAGS_SET.has(c[8])?c[8]:"",caste:c[9]||"",notes:c[10]||""};}).filter(r=>r.name);
    setSaving(true);
    try{
      const created=await Promise.all(rows.map(r=>insertContact(r)));
      setContacts(cs=>[...created,...cs]);
      setShowImport(false);showToast(`${created.length} contacts imported ✓`);
    }catch(err){showToast("Import error: "+err.message,"error");}
    setSaving(false);
  };

  const handleBoothExcel=async rows=>{
    setSaving(true);
    try{
      const results=await Promise.all(rows.map(r=>upsertBoothByBno({bno:r.bno,bnm:r.bnm||"",mandal:r.mandal||"",panchayat:r.panchayat||"",voters:parseInt(r.voters)||0,rating:"",castes:["","",""],elec:[{cast:0,votes:[0,0,0]},{cast:0,votes:[0,0,0]},{cast:0,votes:[0,0,0]}],notes:""})));
      const fresh=await fetchBooths();setBooths(fresh);
      setShowExcel(false);showToast(`${results.length} booths imported ✓`);
    }catch(err){showToast("Import error: "+err.message,"error");}
    setSaving(false);
  };

  const exportCSV=()=>{
    const rows=[["Name","Phone","WhatsApp","Mandal","Panchayat","Village","BoothNo","BoothName","Tag","Caste","Notes"]];
    filteredC.forEach(c=>rows.push([c.name,c.phone,c.wa,c.mandal,c.panchayat,c.village,c.bno,c.bnm,c.tag,c.caste,c.notes]));
    const csv=rows.map(r=>r.map(v=>'"'+String(v||"").replace(/"/g,'""')+'"').join(",")).join("\n");
    const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download="contacts.csv";a.click();
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if(loading) return <LoadingScreen message="Connecting to database…"/>;
  if(loadErr) return <ErrorScreen message={loadErr} onRetry={loadAll}/>;

  const thS={position:"sticky",top:0,fontSize:10,fontWeight:700,color:C.gray400,textTransform:"uppercase",letterSpacing:".05em",padding:"8px 10px",borderBottom:`2px solid ${C.gray200}`,textAlign:"left",userSelect:"none",background:C.gray50,whiteSpace:"nowrap"};
  const thSB={...thS,background:"#F0FDFA",color:C.teal,borderBottom:`2px solid ${C.teal}33`};
  const tdS={padding:"10px 10px",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderBottom:`1px solid ${C.gray100}`};

  return (
    <div id="app-root" style={{display:"flex",flexDirection:"column",height:"100vh",background:C.white,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",fontSize:13,overflow:"hidden"}}>

      {/* CONSTANTS BAR */}


<div id="const-bar" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, paddingRight: 12 }}>
  {/* Sync status indicator */}
  {syncStatus && (
    <span style={{
      fontSize: 11, fontWeight: 600,
      color: syncStatus === "ok" ? "#6EE7B7" : syncStatus === "error" ? "#FCA5A5" : "#A5B4FC"
    }}>
      {syncStatus === "syncing" ? "⏳ Syncing…" : syncStatus === "ok" ? "✅ Synced" : "❌ Sync failed"}
    </span>
  )}
  {/* Pull from Sheets button — only shown when URL is configured */}
  {settings.sheetsUrl && (
    <button
      onClick={pullFromSheets}
      style={{ padding: "5px 10px", fontSize: 10, background: "transparent", border: "1px solid #4338CA", borderRadius: 6, color: "#C7D2FE", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}
    >
      ⬇️ Pull Sheets
    </button>
  )}
  <button
    onClick={() => reqAdmin(() => setShowConst(true))}
    style={{ padding: "5px 10px", fontSize: 10, background: "transparent", border: "1px solid #4338CA", borderRadius: 6, color: "#C7D2FE", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}
  >
    ✏️ Edit
  </button>
</div>

      <div id="app-body" style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* SIDEBAR */}
        <div id="sidebar-desktop" style={{width:200,minWidth:200,borderRight:`1px solid ${C.gray200}`,background:C.gray50,display:"flex",flexDirection:"column",overflowY:"auto"}}>
          <div style={{padding:"14px 14px 10px",borderBottom:`1px solid ${C.gray200}`}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:"0 3px 10px rgba(79,70,229,.3)"}}>📋</div>
              <div><div style={{fontSize:14,fontWeight:800,color:C.gray900}}>ContactBook</div><div style={{fontSize:10,color:C.gray400,fontWeight:500}}>Electoral Manager</div></div>
            </div>
          </div>
          <div style={{padding:"12px 8px 4px",fontSize:9,fontWeight:800,color:C.gray400,textTransform:"uppercase",letterSpacing:".08em"}}>Contacts</div>
          <SBI icon="👥" label="All Contacts" count={contacts.length} active={screen==="contacts"&&!activeTag} onClick={()=>{setScreen("contacts");setActiveTag("");setFT("");setSearch("");setPage(1);setSelC(null);}}/>
          <SBI icon="🗺️" label="By Mandal"    active={false} onClick={()=>{setScreen("contacts");setActiveTag("");}}/>
          <SBI icon="🏘️" label="By Panchayat" active={false} onClick={()=>{setScreen("contacts");setActiveTag("");}}/>
          <div style={{padding:"12px 8px 4px",fontSize:9,fontWeight:800,color:C.gray400,textTransform:"uppercase",letterSpacing:".08em"}}>By Tag</div>
          {TAGS.map((tag,i)=>(<SBI key={tag} icon={<span style={{width:8,height:8,borderRadius:"50%",background:Object.values(TAG_STYLE)[i]?.cl,display:"inline-block"}}/>} label={tag} count={tagCounts[tag]||0} active={activeTag===tag} onClick={()=>{setScreen("contacts");setActiveTag(tag);setFT("");setSearch("");setPage(1);setSelC(null);}} color={Object.values(TAG_STYLE)[i]?.cl}/>))}
          <div style={{padding:"12px 8px 4px",fontSize:9,fontWeight:800,color:C.gray400,textTransform:"uppercase",letterSpacing:".08em"}}>Modules</div>
          <SBI icon="📍" label="Booth Mgmt"    count={booths.length} active={screen==="booths"} onClick={()=>{setScreen("booths");setActiveTag("");setSelB(null);}} color={C.teal}/>
          <SBI icon="⚙️" label="Settings"       active={false} onClick={()=>reqAdmin(()=>setShowSettings(true))}/>
          <SBI icon="🔗" label="Google Sheets" active={false} onClick={() => reqAdmin(() => setShowSheets(true))}/>

          <div style={{padding:"10px 8px",borderTop:`1px solid ${C.gray200}`,marginTop:"auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {[["Contacts",contacts.length,C.primary],["Mandals",settings.mandals.length,C.success],["Booths",booths.length,C.teal],["Castes",settings.castes.length,C.amber]].map(([l,v,cl])=>(
              <div key={l} style={{background:C.white,border:`1.5px solid ${cl}33`,borderRadius:8,padding:"7px 9px",textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:800,color:cl}}>{v}</div>
                <div style={{fontSize:9,color:C.gray400,fontWeight:600,textTransform:"uppercase"}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div id="main-content" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

          {screen==="contacts"&&<>

          <div id="hero-bar" style={{background:`linear-gradient(135deg,${C.primaryLight},#E0E7FF)`,padding:"12px 16px",borderBottom:`1px solid ${C.gray200}`,flexShrink:0}}>
          
            {/* Row 1 — Title + Buttons */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:800,color:C.primaryDark}}>{activeTag||"All Contacts"}</div>
                <div style={{fontSize:11,color:C.primary,fontWeight:500}}>{contacts.length} total · {filteredC.length} shown</div>
              </div>
              {/* Buttons — always visible */}
              <div className="hero-buttons" style={{display:"flex",gap:6,alignItems:"center"}}>
                <Btn v="success" onClick={()=>{setEditC(null);setShowAdd(true);}} style={{padding:"9px 16px",fontSize:13}}>＋ Add</Btn>
                <Btn v="ghost" onClick={()=>reqAdmin(exportCSV)} title="Export CSV (Admin)" style={{padding:"9px 12px"}}>⬇️</Btn>
                <Btn v="ghost" onClick={()=>setShowImport(true)} title="Import CSV" style={{padding:"9px 12px"}}>⬆️</Btn>
              </div>
            </div>
          
            {/* Row 2 — Search bar full width */}
            <input
              value={search}
              onChange={e=>{setSearch(e.target.value);setPage(1);}}
              placeholder="🔍  Search name, phone, caste, booth…"
              style={{
                width:"100%",
                padding:"9px 14px",
                fontSize:13,
                border:`1.5px solid ${C.gray200}`,
                borderRadius:22,
                background:C.white,
                color:C.gray900,
                outline:"none",
                boxShadow:"0 2px 8px rgba(0,0,0,.06)",
              }}
            />
          </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.gray200}`,flexShrink:0}}>
              {[["Total",contacts.length,C.primary,"👥"],["Karyakartas",tagCounts["Karyakarta"]||0,C.success,"⚡"],["Key Voters",tagCounts["Key Voter"]||0,"#7C3AED","⭐"],["Opponents",tagCounts["Opponent"]||0,C.red,"⚠️"]].map(([l,v,cl,ic])=>(
                <div key={l} style={{background:C.white,border:`1.5px solid ${cl}22`,borderRadius:12,padding:"10px 13px",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
                  <div style={{fontSize:10,color:C.gray400,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>{ic} {l}</div>
                  <div style={{fontSize:24,fontWeight:800,color:cl,lineHeight:1}}>{v}</div>
                </div>
              ))}
            </div>
            <div id="filter-bar" style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderBottom:`1px solid ${C.gray200}`,flexShrink:0,flexWrap:"wrap",background:C.gray50}}>
              {[[fM,v=>{setFM(v);setFP("");setPage(1);},"All Mandals",settings.mandals.map(m=>m.name)],[fP,v=>{setFP(v);setPage(1);},"All Panchayats",mandalPanchs],[fB,v=>{setFB(v);setPage(1);},"All Booths",[...new Set(contacts.map(c=>c.bno).filter(Boolean))].sort((a,b)=>+a-+b)],[fCaste,v=>{setFCaste(v);setPage(1);},"All Castes",settings.castes],[fT,v=>{setFT(v);setActiveTag("");setPage(1);},"All Tags",TAGS]].map(([val,setter,ph,opts],i)=>(
                <select key={i} value={val} onChange={e=>setter(e.target.value)} style={{padding:"6px 10px",fontSize:11,border:`1.5px solid ${C.gray200}`,borderRadius:8,background:val?C.primaryLight:C.white,color:val?C.primary:C.gray600,fontWeight:val?700:400,outline:"none",cursor:"pointer"}}>
                  <option value="">{ph}</option>{opts.map(o=><option key={o}>{o}</option>)}
                </select>
              ))}
              {(search||fM||fP||fB||fCaste||fT||activeTag)&&<button onClick={()=>{setSearch("");setFM("");setFP("");setFB("");setFCaste("");setFT("");setActiveTag("");setPage(1);}} style={{padding:"5px 10px",fontSize:11,background:"#FEE2E2",color:C.red,border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>✕ Clear</button>}
              <span style={{marginLeft:"auto",fontSize:11,color:C.gray400,fontWeight:600}}>{filteredC.length} result{filteredC.length!==1?"s":""}</span>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              <table id="contact-table" style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                <thead><tr>{[["name","Name",106],["phone","Phone",88],["caste","Caste",64],["mandal","Mandal",72],["panchayat","Panchayat",76],["bno","Booth",42],["tag","Tag",86]].map(([col,label,w])=>(<th key={col} style={{...thS,width:w}}>{label}<SortArrow col={col} sort={sort} onSort={col=>setSort(s=>s.col===col?{...s,dir:s.dir==="asc"?"desc":"asc"}:{col,dir:"asc"})}/></th>))}</tr></thead>
                <tbody>{slice.map(c=>(<tr key={c.id} onClick={()=> { 
			setSelC(c);
			if (isMobile) setShowMobileDetail(true);
                     }
	           } style={{background:selC?.id===c.id?C.primaryLight:"transparent",cursor:"pointer",transition:"background .1s"}}>
                  <td style={{...tdS,fontWeight:700,color:C.gray900}}>{c.name}</td>
                  <td style={{...tdS,color:C.gray600}}>{c.phone}</td>
                  <td style={tdS}>{c.caste}</td>
                  <td style={tdS}>{c.mandal}</td>
                  <td style={tdS}>{c.panchayat}</td>
                  <td style={{...tdS,textAlign:"center",fontWeight:700,color:C.primary}}>{c.bno}</td>
                  <td style={tdS}><Badge tag={c.tag}/></td>
                </tr>))}</tbody>
              </table>
              {slice.length===0&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:50,gap:10,color:C.gray400,textAlign:"center"}}><span style={{fontSize:40}}>🔍</span><span style={{fontSize:14,fontWeight:600}}>No contacts found</span></div>}
            </div>
            <div style={{padding:"8px 14px",borderTop:`1px solid ${C.gray200}`,display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.gray600,background:C.gray50,flexShrink:0}}>
              <span style={{fontWeight:600}}>{filteredC.length} contacts · page {page} of {pages}</span>
              <span style={{flex:1}}/>
              <Btn v="ghost" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} style={{padding:"5px 12px"}}>◀ Prev</Btn>
              <Btn v="ghost" onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages} style={{padding:"5px 12px"}}>Next ▶</Btn>
            </div>
          </>}

          {screen==="booths"&&<>
            <div id="booth-hero" style={{background:`linear-gradient(135deg,${C.tealLight},#ECFDF5)`,padding:"12px 16px",borderBottom:`1px solid ${C.teal}33`,flexShrink:0}}>
            
              {/* Row 1 — Title + Add + Excel buttons */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:800,color:C.boothDark}}>📍 Booth Management</div>
                  <div style={{fontSize:11,color:C.teal,fontWeight:500}}>{booths.length} booths · {filteredB.length} shown</div>
                </div>
                <Btn v="teal" onClick={()=>{setEditB(null);setShowBAdd(true);}} style={{padding:"10px 20px",fontSize:14}}>＋ Add</Btn>
                <Btn v="ghost" onClick={()=>setShowExcel(true)} style={{background:C.tealLight,color:C.teal,border:`1.5px solid ${C.teal}55`}}>📊</Btn>
              </div>
            
              {/* Row 2 — Search (full width) */}
              <input
                value={bSearch}
                onChange={e=>setBSearch(e.target.value)}
                placeholder="🔍  Search booths by name, panchayat, caste…"
                style={{
                  width:"100%",
                  padding:"9px 14px",
                  fontSize:13,
                  border:`1.5px solid ${C.teal}55`,
                  borderRadius:22,
                  background:C.white,
                  color:C.gray900,
                  outline:"none",
                  boxShadow:"0 2px 8px rgba(0,0,0,.06)",
                  marginBottom:8,
                }}
              />
            
              {/* Row 3 — Filters */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <select
                  value={bfR}
                  onChange={e=>setBfR(e.target.value)}
                  style={{
                    flex:1, minWidth:100,
                    padding:"8px 10px", fontSize:12,
                    border:`1.5px solid ${C.teal}55`, borderRadius:9,
                    background:bfR?C.tealLight:C.white,
                    color:bfR?C.teal:C.gray600,
                    fontWeight:bfR?700:400, outline:"none"
                  }}
                >
                  <option value="">All Ratings</option>
                  <option>A</option><option>B</option><option>C</option>
                </select>
                <select
                  value={bfP}
                  onChange={e=>setBfP(e.target.value)}
                  style={{
                    flex:2, minWidth:140,
                    padding:"8px 10px", fontSize:12,
                    border:`1.5px solid ${C.teal}55`, borderRadius:9,
                    background:bfP?C.tealLight:C.white,
                    color:bfP?C.teal:C.gray600,
                    fontWeight:bfP?700:400, outline:"none"
                  }}
                >
                  <option value="">All Panchayats</option>
                  {allPanchs.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div id="booth-metrics" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.teal}22`,flexShrink:0,background:"#F0FDFA"}}>
              {[["Total",booths.length,C.teal,"📍"],["Rating A",boothRatingCounts.A,C.success,"✅"],["Rating B",boothRatingCounts.B,C.amber,"⚠️"],["Rating C",boothRatingCounts.C,C.red,"❌"]].map(([l,v,cl,ic])=>(
                <div key={l} style={{background:C.white,border:`1.5px solid ${cl}33`,borderRadius:12,padding:"10px 13px",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
                  <div style={{fontSize:10,color:C.gray400,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>{ic} {l}</div>
                  <div style={{fontSize:24,fontWeight:800,color:cl,lineHeight:1}}>{v}</div>
                </div>
              ))}
            </div>
            <div id="table-wrap" style={{flex:1,overflowY:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                <thead><tr>
                  {[["bno","No.",50],["bnm","Booth Name",120],["mandal","Mandal",80],["panchayat","Panchayat",90],["voters","Voters",60],["rating","Rating",80],["castes","Top Castes",null],["last","Last Election",null]].map(([col,label,w])=>(
                    <th key={col} style={{...thSB,...(w?{width:w}:{})}}>{label}{col!=="castes"&&col!=="last"&&<SortArrow col={col} sort={bSort} onSort={col=>setBSort(s=>s.col===col?{...s,dir:s.dir==="asc"?"desc":"asc"}:{col,dir:"asc"})} booth/>}</th>
                  ))}
                </tr></thead>
                <tbody>{filteredB.map(b=>{const last=b.elec[2]||{votes:[]};return(
                  <tr key={b.id} onClick={()=> {
			setSelB(b);
			if (isMobile) setShowMobileDetail(true);
                        }
		      } style={{background:selB?.id===b.id?C.tealLight:"transparent",cursor:"pointer",transition:"background .1s",borderBottom:`1px solid ${C.teal}11`}}>
                    <td style={{...tdS,textAlign:"center",fontWeight:800,color:C.teal,fontSize:14}}>{b.bno}</td>
                    <td style={{...tdS,fontWeight:700,color:C.gray900}}>{b.bnm||"—"}</td>
                    <td style={{...tdS,color:C.gray600}}>{b.mandal}</td>
                    <td style={{...tdS,color:C.gray600}}>{b.panchayat}</td>
                    <td style={{...tdS,color:C.gray600,textAlign:"right"}}>{b.voters||"—"}</td>
                    <td style={{...tdS,textAlign:"center"}}>{b.rating?<RBadge r={b.rating}/>:"—"}</td>
                    <td style={{...tdS,fontSize:11,color:C.gray600}}>{b.castes.filter(Boolean).join(", ")||"—"}</td>
                    <td style={{...tdS,fontSize:11,color:C.gray600}}>{settings.parties.map((p,i)=>`${p}:${last.votes?.[i]||0}`).join(" / ")}</td>
                  </tr>
                );})}</tbody>
              </table>
              {filteredB.length===0&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:50,gap:10,color:C.gray400,textAlign:"center"}}><span style={{fontSize:40}}>📍</span><span style={{fontSize:14,fontWeight:600}}>No booths found</span></div>}
            </div>
          </>}
        </div>

        {/* DETAIL PANEL */}
        <div id="detail-panel-desktop" style={{width:248,minWidth:248,borderLeft:`1px solid ${C.gray200}`,display:"flex",flexDirection:"column",overflowY:"auto",background:C.white}}>
          {screen==="contacts"
            ?<ContactDetail contact={contacts.find(c=>c.id===selC?.id)||null} settings={settings} onEdit={c=>{setEditC(c);setShowAdd(true);}} onDelete={handleDeleteContact}/>
            :<BoothDetail   booth={booths.find(b=>b.id===selB?.id)||null}     settings={settings} onEdit={b=>{setEditB(b);setShowBAdd(true);}} onDelete={handleDeleteBooth}/>
          }
        </div>
      </div>

      {/* ── MOBILE DETAIL MODAL ── */}
      {showMobileDetail && (
        <div
          onClick={e => e.target === e.currentTarget && setShowMobileDetail(false)}
          style={{
            position:"fixed", inset:0,
            background:"rgba(17,24,39,.6)",
            display:"flex", alignItems:"flex-end", justifyContent:"center",
            zIndex:800, backdropFilter:"blur(3px)"
          }}
        >
          <div style={{
            background:"#FFFFFF",
            borderRadius:"20px 20px 0 0",
            width:"100%", maxHeight:"85vh",
            overflowY:"auto", paddingBottom:80
          }}>
            {/* Drag handle */}
            <div style={{
              width:40, height:4,
              background:"#E5E7EB",
              borderRadius:2,
              margin:"12px auto 0"
            }}/>
            {screen === "contacts"
              ? <ContactDetail
                  contact={contacts.find(c => c.id === selC?.id) || null}
                  settings={settings}
                  onEdit={c => {
                    setEditC(c);
                    setShowAdd(true);
                    setShowMobileDetail(false);
                  }}
                  onDelete={id => {
                    handleDeleteContact(id);
                    setShowMobileDetail(false);
                  }}
                />
              : <BoothDetail
                  booth={booths.find(b => b.id === selB?.id) || null}
                  settings={settings}
                  onEdit={b => {
                    setEditB(b);
                    setShowBAdd(true);
                    setShowMobileDetail(false);
                  }}
                  onDelete={id => {
                    handleDeleteBooth(id);
                    setShowMobileDetail(false);
                  }}
                />
            }
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV (shown on mobile via CSS) ── */}
      <div id="bottom-nav">

        {/* Contacts tab */}
        <button
          onClick={() => {
            setScreen("contacts");
            setActiveTag("");
            setSelC(null);
            setSelB(null);
          }}
          style={{
            flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            gap:3, background:"none", border:"none",
            cursor:"pointer", fontFamily:"inherit",
            color: screen === "contacts" ? "#4F46E5" : "#9CA3AF",
            borderTop: screen === "contacts" ? "2.5px solid #4F46E5" : "2.5px solid transparent",
          }}
        >
          <span style={{fontSize:20}}>👥</span>
          <span style={{fontSize:10, fontWeight:700}}>Contacts</span>
        </button>

        {/* Big green ADD button in centre */}
        <div style={{
          flex:1, display:"flex",
          alignItems:"center", justifyContent:"center",
          position:"relative"
        }}>
          <button
            onClick={() => { setEditC(null); setShowAdd(true); }}
            style={{
              width:54, height:54, borderRadius:"50%",
              border:"none", cursor:"pointer",
              background:"linear-gradient(135deg,#059669,#047857)",
              color:"#FFFFFF", fontSize:28, fontWeight:800,
              boxShadow:"0 6px 20px rgba(5,150,105,.45)",
              display:"flex", alignItems:"center", justifyContent:"center",
              position:"absolute", bottom:6,
            }}
          >
            ＋
          </button>
        </div>

        {/* Booths tab */}
        <button
          onClick={() => {
            setScreen("booths");
            setActiveTag("");
            setSelC(null);
            setSelB(null);
          }}
          style={{
            flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            gap:3, background:"none", border:"none",
            cursor:"pointer", fontFamily:"inherit",
            color: screen === "booths" ? "#0D9488" : "#9CA3AF",
            borderTop: screen === "booths" ? "2.5px solid #0D9488" : "2.5px solid transparent",
          }}
        >
          <span style={{fontSize:20}}>📍</span>
          <span style={{fontSize:10, fontWeight:700}}>Booths</span>
        </button>

        {/* Settings tab */}
        <button
          onClick={() => reqAdmin(() => setShowSettings(true))}
          style={{
            flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            gap:3, background:"none", border:"none",
            cursor:"pointer", fontFamily:"inherit",
            color:"#9CA3AF",
          }}
        >
          <span style={{fontSize:20}}>⚙️</span>
          <span style={{fontSize:10, fontWeight:700}}>Settings</span>
        </button>

      </div>

      {/* ── MODALS start below this line ── */}
      {/* MODALS */}
      <OTPModal     open={showOTP}      onClose={()=>setShowOTP(false)}      pin={settings.adminPin} onSuccess={()=>{setIsAdmin(true);setShowOTP(false);if(otpAction){otpAction();setOtpAction(null);}}}/>
      <SettingsModal open={showSettings} onClose={()=>setShowSettings(false)} settings={settings} onSave={handleSaveSettings} saving={saving}/>
      <SheetsModal open={showSheets} onClose={() => setShowSheets(false)} settings={settings} onSave={handleSaveSheetsUrl} />

      <ContactForm  open={showAdd}      onClose={()=>{setShowAdd(false);setEditC(null);}}   initial={editC}  settings={settings} onSave={handleSaveContact} saving={saving}/>
      <BoothForm    open={showBAdd}     onClose={()=>{setShowBAdd(false);setEditB(null);}}  initial={editB}  settings={settings} onSave={handleSaveBooth}   saving={saving} existingBooths={booths}/>
      <ConstModal   open={showConst}    onClose={()=>setShowConst(false)}     settings={settings} onSave={handleSaveConst}    saving={saving}/>
      <ImportModal  open={showImport}   onClose={()=>setShowImport(false)}    onImport={handleImport} saving={saving}/>
      <ExcelModal   open={showExcel}    onClose={()=>setShowExcel(false)}     onImport={handleBoothExcel} saving={saving}/>
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}