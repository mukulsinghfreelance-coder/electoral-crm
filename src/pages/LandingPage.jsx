import { useState, useEffect } from 'react'
import { lazy, Suspense } from 'react'
import { useAuth } from '../context/AuthContext'
const PrivacyPolicy  = lazy(() => import('./PrivacyPolicy'))
const TermsOfService = lazy(() => import('./TermsOfService'))
const ContactUs      = lazy(() => import('./ContactUs'))
import { PLANS as DEFAULT_PLANS, calcMonthlyPrice } from '../config'

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  en: {
    nav: { features:'Features', howItWorks:'How It Works', pricing:'Pricing', signIn:'Sign In' },
    hero: {
      badge: '🗳️ Electoral Intelligence Platform',
      h1a: 'Win Every Booth.',
      h1b: 'Know Every Voter.',
      h1hi: 'जीतो हर बूथ। जानो हर वोटर।',
      sub: 'Electoral Intelligence, Simplified.',
      desc: 'Sampark.AI gives you complete command over your constituency — manage every contact, every booth, every ward — powered by intelligence.',
      cta: 'Get Started Free',
      ctaSub: 'No credit card required',
      signIn: 'Already registered? Sign In →',
    },
    features: {
      badge: 'Know the Ground. Win Your Seat.',
      title: 'Everything you need to win',
      subtitle: 'Built for leaders who understand that elections are won on the ground.',
      items: [
        { icon:'👥', title:'Smart Contact Management', hi:'संपर्क प्रबंधन', desc:'Tag every voter by loyalty, caste, booth and relationship. Know exactly who supports you and who needs attention.' },
        { icon:'🏛️', title:'Booth-Level Intelligence', hi:'बूथ स्तर की जानकारी', desc:'Rate every booth A, B or C. Track karyakartas, voter turnout and booth-wise performance in real time.' },
        { icon:'🗂️', title:'Caste & Community Analysis', hi:'जाति वर्गीकरण', desc:'Understand the community fabric of your constituency. Classify contacts and plan outreach with precision.' },
      ]
    },
    howItWorks: {
      badge: 'Simple. Powerful. Fast.',
      title: 'Up and running in minutes',
      steps: [
        { n:'01', title:'Sign Up Free', desc:'Create your account in seconds. No forms, no paperwork. Just your email.' },
        { n:'02', title:'Add Your Constituency', desc:'Select your Vidhan Sabha from 4000+ constituencies across India.' },
        { n:'03', title:'Start Winning', desc:'Add contacts, manage booths, track your ground game — all in one place.' },
      ]
    },
    pricing: {
      badge: 'Simple Pricing',
      title: 'Start free. Scale as you grow.',
      subtitle: 'No hidden fees. No long-term contracts.',
      plans: [
        { key:'free',    name:'Free',    price:'₹0',            period:'',       desc:'Perfect to get started',             vs:'FREE_VS',             contacts:'FREE_CONTACTS', features:['1 Vidhan Sabha','Contact management','Booth tracking','Basic reports'],                                                        cta:'Get Started Free',  highlight:false },
        { key:'premium', name:'Premium', price:'PREMIUM_PRICE',  period:'/month', desc:'Unlimited contacts · Pay per VS',    vs:'Pay per VS',          contacts:'Unlimited contacts', features:['Unlimited contacts','Multiple VSs','Advanced analytics','Priority support','PREMIUM_EXTRA/mo per extra VS'], cta:'Start Premium',     highlight:true, badge:'Most Popular' },
      ]
    },
    cta: {
      title: 'Connect with Every Voter.',
      title2: 'Win Every Seat.',
      sub: 'Electoral Intelligence, Simplified.',
      btn: 'Start Free Today',
      note: 'No credit card required · Set up in 2 minutes',
    },
    footer: {
      tagline: 'Electoral Intelligence, Simplified.',
      links: ['Privacy Policy','Terms of Service','Contact Us'],
      copy: '© 2025 Sampark.AI. All rights reserved.',
    }
  },
  hi: {
    nav: { features:'विशेषताएं', howItWorks:'कैसे काम करता है', pricing:'मूल्य निर्धारण', signIn:'साइन इन' },
    hero: {
      badge: '🗳️ चुनावी इंटेलिजेंस प्लेटफॉर्म',
      h1a: 'जीतो हर बूथ।',
      h1b: 'जानो हर वोटर।',
      h1hi: 'Win Every Booth. Know Every Voter.',
      sub: 'चुनावी बुद्धिमत्ता, सरलीकृत।',
      desc: 'Sampark.AI आपको अपने क्षेत्र पर पूरा नियंत्रण देता है — हर संपर्क, हर बूथ, हर वार्ड — बुद्धिमत्ता से संचालित।',
      cta: 'मुफ्त शुरू करें',
      ctaSub: 'क्रेडिट कार्ड की आवश्यकता नहीं',
      signIn: 'पहले से पंजीकृत? साइन इन करें →',
    },
    features: {
      badge: 'जमीन जानो। सीट जीतो।',
      title: 'जीत के लिए सब कुछ',
      subtitle: 'उन नेताओं के लिए बना जो जानते हैं कि चुनाव जमीन पर जीते जाते हैं।',
      items: [
        { icon:'👥', title:'स्मार्ट संपर्क प्रबंधन', hi:'Smart Contact Management', desc:'हर वोटर को वफादारी, जाति, बूथ और रिश्ते के आधार पर टैग करें।' },
        { icon:'🏛️', title:'बूथ-स्तरीय जानकारी', hi:'Booth-Level Intelligence', desc:'हर बूथ को A, B या C रेट करें। कार्यकर्ताओं और वोटर टर्नआउट को ट्रैक करें।' },
        { icon:'🗂️', title:'जाति एवं समुदाय विश्लेषण', hi:'Caste & Community Analysis', desc:'अपने क्षेत्र की सामुदायिक संरचना समझें और सटीक आउटरीच प्लान करें।' },
      ]
    },
    howItWorks: {
      badge: 'सरल। शक्तिशाली। तेज़।',
      title: 'मिनटों में शुरू करें',
      steps: [
        { n:'01', title:'मुफ्त साइन अप', desc:'सेकंड में अकाउंट बनाएं। सिर्फ अपना ईमेल चाहिए।' },
        { n:'02', title:'अपना क्षेत्र जोड़ें', desc:'भारत के 4000+ विधान सभा क्षेत्रों में से अपना चुनें।' },
        { n:'03', title:'जीतना शुरू करें', desc:'संपर्क जोड़ें, बूथ मैनेज करें, ग्राउंड गेम ट्रैक करें।' },
      ]
    },
    pricing: {
      badge: 'सरल मूल्य निर्धारण',
      title: 'मुफ्त शुरू करें। जरूरत के साथ बढ़ें।',
      subtitle: 'कोई छुपी फीस नहीं। कोई लंबा अनुबंध नहीं।',
      plans: [
        { key:'free',    name:'फ्री',    price:'₹0',            period:'',      desc:'शुरुआत के लिए बिल्कुल सही',          vs:'FREE_VS_HI',          contacts:'FREE_CONTACTS_HI', features:['1 विधान सभा','संपर्क प्रबंधन','बूथ ट्रैकिंग','बेसिक रिपोर्ट'],                                                      cta:'मुफ्त शुरू करें',  highlight:false },
        { key:'premium', name:'प्रीमियम', price:'PREMIUM_PRICE', period:'/माह',  desc:'असीमित संपर्क · प्रति VS भुगतान',     vs:'प्रति VS भुगतान',    contacts:'असीमित संपर्क', features:['असीमित संपर्क','एकाधिक VS','एडवांस्ड एनालिटिक्स','प्राथमिकता सहायता','PREMIUM_EXTRA/माह प्रति अतिरिक्त VS'], cta:'प्रीमियम शुरू करें', highlight:true, badge:'सर्वाधिक लोकप्रिय' },
      ]
    },
    cta: {
      title: 'हर वोटर से जुड़ें।',
      title2: 'हर सीट जीतें।',
      sub: 'चुनावी बुद्धिमत्ता, सरलीकृत।',
      btn: 'आज मुफ्त शुरू करें',
      note: 'क्रेडिट कार्ड की आवश्यकता नहीं · 2 मिनट में सेटअप',
    },
    footer: {
      tagline: 'चुनावी बुद्धिमत्ता, सरलीकृत।',
      links: ['गोपनीयता नीति','सेवा की शर्तें','संपर्क करें'],
      copy: '© 2025 Sampark.AI. सर्वाधिकार सुरक्षित।',
    }
  }
}

// ─── COLORS ───────────────────────────────────────────────────────────────────
const C = {
  bg:      '#0F0E1A',
  bgCard:  '#16152A',
  bgCard2: '#1C1B35',
  border:  'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.15)',
  primary: '#6C63FF',
  primaryD:'#4F46E5',
  accent:  '#A78BFA',
  gold:    '#F59E0B',
  white:   '#FFFFFF',
  gray:    '#A5B4FC',
  gray2:   '#6B7280',
  success: '#10B981',
  text:    '#F1F0FF',
  textSub: '#9CA3AF',
}

// ─── CONTACT MOCKUP ───────────────────────────────────────────────────────────
function ContactMockup() {
  const contacts = [
    { name:'Ramesh Kumar', caste:'Yadav', booth:'B-12', tag:'Supporter', rating:'A', phone:'98765 43210' },
    { name:'Sunita Devi', caste:'Kurmi', booth:'B-07', tag:'Key Voter', rating:'A', phone:'87654 32109' },
    { name:'Arun Singh', caste:'Rajput', booth:'B-15', tag:'Karyakarta', rating:'B', phone:'76543 21098' },
    { name:'Fatima Begum', caste:'Muslim', booth:'B-03', tag:'Neutral', rating:'B', phone:'65432 10987' },
    { name:'Vijay Paswan', caste:'Dusadh', booth:'B-09', tag:'Supporter', rating:'A', phone:'54321 09876' },
  ]
  const tagColor = { 'Key Voter':'#10B981', 'Karyakarta':'#6C63FF', 'Supporter':'#3B82F6', 'Neutral':'#6B7280' }
  const ratingColor = { A:'#10B981', B:'#F59E0B', C:'#EF4444' }
  return (
    <div style={{ background:'#16152A', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', fontFamily:"inherit" }}>
      {/* Header bar */}
      <div style={{ background:'#1C1B35', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444' }}/>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#F59E0B' }}/>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#10B981' }}/>
        </div>
        <div style={{ fontSize:11, color:'#6B7280', fontWeight:500 }}>Contacts — Bankipur VS</div>
        <div style={{ fontSize:11, color:'#6C63FF', fontWeight:600 }}>+ Add Contact</div>
      </div>
      {/* Search + filters */}
      <div style={{ padding:'10px 16px', display:'flex', gap:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 10px', fontSize:11, color:'#6B7280' }}>🔍 Search contacts...</div>
        <div style={{ background:'rgba(108,99,255,0.15)', border:'1px solid rgba(108,99,255,0.3)', borderRadius:8, padding:'6px 10px', fontSize:11, color:'#A78BFA' }}>Filter ▾</div>
      </div>
      {/* Stats row */}
      <div style={{ padding:'8px 16px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {[['Total','1,247'],['A-rated','523'],['Karyakartas','48'],['Booths','18']].map(([l,v]) => (
          <div key={l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#F1F0FF' }}>{v}</div>
            <div style={{ fontSize:9, color:'#6B7280', marginTop:1 }}>{l}</div>
          </div>
        ))}
      </div>
      {/* Contact list */}
      {contacts.map((c,i) => (
        <div key={i} style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,0.04)', background: i===0 ? 'rgba(108,99,255,0.06)' : 'transparent' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(135deg,${C.primary},${C.primaryD})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff', fontWeight:700, flexShrink:0 }}>
            {c.name[0]}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#F1F0FF' }}>{c.name}</div>
              <span style={{ background:tagColor[c.tag]+'22', color:tagColor[c.tag], fontSize:9, padding:'1px 6px', borderRadius:10, fontWeight:600 }}>{c.tag}</span>
              <span style={{ background:ratingColor[c.rating]+'22', color:ratingColor[c.rating], fontSize:9, padding:'1px 6px', borderRadius:10, fontWeight:700 }}>{c.rating}</span>
            </div>
            <div style={{ fontSize:10, color:'#6B7280', marginTop:2 }}>{c.caste} · {c.booth} · {c.phone}</div>
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>›</div>
        </div>
      ))}
      <div style={{ padding:'10px 16px', textAlign:'center', fontSize:10, color:'#6B7280' }}>1,247 contacts · Showing 5 of 1,247</div>
    </div>
  )
}

// ─── BOOTH MOCKUP ─────────────────────────────────────────────────────────────
function BoothMockup() {
  const booths = [
    { id:'B-01', name:'Gandhi Nagar Primary School', voters:820, karyakartas:4, rating:'A', voted:612 },
    { id:'B-02', name:'Nehru Park Community Hall', voters:650, karyakartas:3, rating:'B', voted:410 },
    { id:'B-03', name:'Shiv Mandir, Sector 4', voters:910, karyakartas:5, rating:'A', voted:720 },
    { id:'B-04', name:'Municipal Ward Office', voters:540, karyakartas:2, rating:'C', voted:280 },
    { id:'B-05', name:'Rajiv Colony School', voters:780, karyakartas:4, rating:'B', voted:520 },
  ]
  const ratingBg  = { A:'rgba(16,185,129,0.15)', B:'rgba(245,158,11,0.15)', C:'rgba(239,68,68,0.15)' }
  const ratingCl  = { A:'#10B981', B:'#F59E0B', C:'#EF4444' }
  return (
    <div style={{ background:'#16152A', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', fontFamily:'inherit' }}>
      <div style={{ background:'#1C1B35', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444' }}/>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#F59E0B' }}/>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#10B981' }}/>
        </div>
        <div style={{ fontSize:11, color:'#6B7280', fontWeight:500 }}>Booths — Bankipur VS</div>
        <div style={{ fontSize:11, color:'#6C63FF', fontWeight:600 }}>+ Add Booth</div>
      </div>
      {/* Summary */}
      <div style={{ padding:'10px 16px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {[['Total Booths','18'],['A-Rated','9'],['Avg Turnout','68%']].map(([l,v]) => (
          <div key={l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px', textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#F1F0FF' }}>{v}</div>
            <div style={{ fontSize:9, color:'#6B7280', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>
      {/* Rating bar */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:10, color:'#6B7280', marginBottom:6 }}>Booth ratings distribution</div>
        <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', gap:2 }}>
          <div style={{ flex:9, background:'#10B981', borderRadius:4 }}/>
          <div style={{ flex:6, background:'#F59E0B', borderRadius:4 }}/>
          <div style={{ flex:3, background:'#EF4444', borderRadius:4 }}/>
        </div>
        <div style={{ display:'flex', gap:12, marginTop:6 }}>
          {[['A — Strong','#10B981','9'],['B — Moderate','#F59E0B','6'],['C — Tough','#EF4444','3']].map(([l,c,n]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:c }}/>
              <span style={{ fontSize:9, color:'#6B7280' }}>{l} ({n})</span>
            </div>
          ))}
        </div>
      </div>
      {/* Booth list */}
      {booths.map((b,i) => (
        <div key={i} style={{ padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', background: i===0 ? 'rgba(108,99,255,0.06)' : 'transparent' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:10, fontWeight:700, color:'#6B7280' }}>{b.id}</span>
              <span style={{ fontSize:11, fontWeight:600, color:'#F1F0FF' }}>{b.name}</span>
            </div>
            <span style={{ background:ratingBg[b.rating], color:ratingCl[b.rating], fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:700 }}>Rating {b.rating}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ width:`${Math.round(b.voted/b.voters*100)}%`, height:'100%', background:ratingCl[b.rating], borderRadius:2 }}/>
            </div>
            <span style={{ fontSize:9, color:'#6B7280', flexShrink:0 }}>{b.voted}/{b.voters} · {b.karyakartas} karyakartas</span>
          </div>
        </div>
      ))}
      <div style={{ padding:'10px 16px', textAlign:'center', fontSize:10, color:'#6B7280' }}>18 booths · 14,820 total voters</div>
    </div>
  )
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────
export default function LandingPage() {
  const { loginWithGoogle, loginWithOTP, verifyOTP, livePlans } = useAuth()
  const PLANS = livePlans || DEFAULT_PLANS

  // Dynamic pricing values — always from live DB pricing
  const freeContacts  = PLANS.free?.contacts === Infinity ? 'Unlimited' : Number(PLANS.free?.contacts || 500).toLocaleString('en-IN')
  const premiumPrice  = `₹${Number(PLANS.premium?.basePrice || 2999).toLocaleString('en-IN')}`
  const premiumExtra  = `₹${Number(PLANS.premium?.extraVS || 2249).toLocaleString('en-IN')}`
  const [lang, setLang]         = useState('en')
  const [showAuth,       setShowAuth]       = useState(false)
  const [intendedPlan,   setIntendedPlan]   = useState(null)
  const [showPage, setShowPage] = useState(null)  // 'privacy' | 'terms' | 'contact'
  const [authStep, setAuthStep] = useState('email') // email | otp
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError]     = useState('')
  const [otpSent, setOtpSent]         = useState(false)

  // Mobile CSS — MUST be before any early return (Rules of Hooks)
  useEffect(() => {
    const el = document.createElement('style')
    el.id = 'lp-mobile-css'
    el.textContent = '@media(max-width:640px){.lp-pg{grid-template-columns:1fr!important;}.lp-nav{flex-wrap:wrap;}}'
    if (!document.getElementById('lp-mobile-css')) document.head.appendChild(el)
    return () => document.getElementById('lp-mobile-css')?.remove()
  }, [])

  const t = T[lang]

  // Inject live pricing into plan cards
  const injectPricing = (plans) => plans.map(p => ({
    ...p,
    contacts: p.contacts === 'FREE_CONTACTS' ? `${freeContacts} contacts`
            : p.contacts === 'FREE_CONTACTS_HI' ? `${freeContacts} संपर्क`
            : p.contacts,
    vs: p.vs === 'FREE_VS' ? `${PLANS.free.vs} Vidhan Sabha`
      : p.vs === 'FREE_VS_HI' ? `${PLANS.free.vs} विधान सभा`
      : p.vs,
    price: p.price === 'PREMIUM_PRICE' ? premiumPrice : p.price,
    features: p.features.map(f =>
      f === 'PREMIUM_EXTRA/mo per extra VS' ? `${premiumExtra}/mo per extra VS`
    : f === 'PREMIUM_EXTRA/माह प्रति अतिरिक्त VS' ? `${premiumExtra}/माह प्रति अतिरिक्त VS`
    : f
    ),
  }))

  const sendOTP = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setAuthError('Enter a valid email'); return }
    setAuthLoading(true); setAuthError('')
    try {
      await loginWithOTP(email.trim().toLowerCase())
      setAuthStep('otp'); setOtpSent(true)
    } catch(e) {
      const msg = e?.message || ''
      if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
        setAuthError('Too many requests. Please wait 60 seconds.')
      } else {
        setAuthError(msg || 'Failed to send OTP')
      }
    }
    setAuthLoading(false)
  }

  const confirmOTP = async () => {
    if (!otp.trim()) { setAuthError('Enter the OTP'); return }
    setAuthLoading(true); setAuthError('')
    try {
      await verifyOTP(email.trim().toLowerCase(), otp.trim())
      // SIGNED_IN fires → AuthContext loads customer → AppRouter redirects
    } catch(e) {
      setAuthError(e?.message || 'Invalid OTP')
    }
    setAuthLoading(false)
  }

  const googleLogin = async () => {
    try { await loginWithGoogle() } catch(e) { setAuthError(e?.message || 'Google login failed') }
  }

  const font = "system-ui,-apple-system,'Segoe UI',sans-serif"

  // Show legal pages
  if (showPage) {
    const onBack = () => setShowPage(null)
    return (
      <Suspense fallback={<div style={{ minHeight:'100vh', background:'#0F0E1A', display:'flex', alignItems:'center', justifyContent:'center', color:'#A5B4FC' }}>⏳ Loading...</div>}>
        {showPage === 'privacy'  && <PrivacyPolicy  onBack={onBack}/>}
        {showPage === 'terms'    && <TermsOfService onBack={onBack}/>}
        {showPage === 'contact'  && <ContactUs      onBack={onBack}/>}
      </Suspense>
    )
  }

  // Mobile CSS injection
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'landing-mobile'
    style.textContent = [
      '@media(max-width:640px){',
      '.landing-pricing-grid{grid-template-columns:1fr!important;}',
      '.landing-nav{flex-wrap:wrap;gap:8px;}',
      '.landing-auth-modal{margin:16px!important;max-width:calc(100vw - 32px)!important;}',
      '}'
    ].join('')
    document.head.appendChild(style)
    return () => document.getElementById('landing-mobile')?.remove()
  }, [])

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:font, color:C.text }}>

      {/* ── NAVBAR ────────────────────────────────────────────────────────────── */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(15,14,26,0.85)', backdropFilter:'blur(16px)', borderBottom:`1px solid ${C.border}`, padding:'0 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.primary},${C.primaryD})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🗳️</div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:C.white, letterSpacing:'-0.02em' }}>Sampark<span style={{ color:C.accent }}>.AI</span></div>
              <div style={{ fontSize:9, color:C.gray, letterSpacing:'0.05em' }}>संपर्क</div>
            </div>
          </div>
          {/* Nav links */}
          <div style={{ display:'flex', alignItems:'center', gap:24 }}>
            {[['features','#features'],['howItWorks','#how'],['pricing','#pricing']].map(([k,href]) => (
              <a key={k} href={href} style={{ fontSize:13, color:C.gray, textDecoration:'none', fontWeight:500 }}
                onMouseEnter={e => e.target.style.color=C.white}
                onMouseLeave={e => e.target.style.color=C.gray}>
                {t.nav[k]}
              </a>
            ))}
          </div>
          {/* Right controls */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Language toggle */}
            <div style={{ display:'flex', background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
              {['en','hi'].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  padding:'5px 10px', fontSize:11, fontWeight:600, border:'none', cursor:'pointer', fontFamily:font,
                  background: lang===l ? C.primary : 'transparent',
                  color: lang===l ? '#fff' : C.gray,
                }}>{l==='en' ? 'EN' : 'हिं'}</button>
              ))}
            </div>
            <button onClick={() => setShowAuth(true)} style={{ padding:'8px 18px', fontSize:13, fontWeight:600, background:`linear-gradient(135deg,${C.primary},${C.primaryD})`, border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontFamily:font }}>
              {t.nav.signIn}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section style={{ padding:'80px 24px 60px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        {/* Background glow */}
        <div style={{ position:'absolute', top:-200, left:'50%', transform:'translateX(-50%)', width:600, height:600, background:`radial-gradient(circle,${C.primary}22 0%,transparent 70%)`, pointerEvents:'none' }}/>
        <div style={{ maxWidth:800, margin:'0 auto', position:'relative' }}>
          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(108,99,255,0.12)', border:`1px solid rgba(108,99,255,0.3)`, borderRadius:20, padding:'6px 14px', marginBottom:28, fontSize:12, color:C.accent, fontWeight:600 }}>
            {t.hero.badge}
          </div>
          {/* Headline */}
          <h1 style={{ margin:'0 0 8px', fontSize:'clamp(36px,5vw,64px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-0.03em', color:C.white }}>
            {t.hero.h1a}<br/>{t.hero.h1b}
          </h1>
          <div style={{ fontSize:'clamp(14px,2vw,18px)', color:C.gray, marginBottom:8, fontStyle:'italic', letterSpacing:'0.01em' }}>
            {t.hero.h1hi}
          </div>
          <div style={{ fontSize:'clamp(16px,2.5vw,22px)', fontWeight:700, color:C.accent, marginBottom:16, letterSpacing:'-0.01em' }}>
            {t.hero.sub}
          </div>
          <p style={{ fontSize:'clamp(14px,2vw,17px)', color:C.textSub, lineHeight:1.7, maxWidth:600, margin:'0 auto 36px' }}>
            {t.hero.desc}
          </p>
          {/* CTA */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <button onClick={() => setShowAuth(true)} style={{ padding:'16px 40px', fontSize:16, fontWeight:700, background:`linear-gradient(135deg,${C.primary},${C.primaryD})`, border:'none', borderRadius:12, color:'#fff', cursor:'pointer', fontFamily:font, letterSpacing:'-0.01em', boxShadow:`0 8px 32px ${C.primary}44` }}>
              {t.hero.cta} →
            </button>
            <div style={{ fontSize:12, color:C.gray2 }}>{t.hero.ctaSub}</div>
            <button onClick={() => setShowAuth(true)} style={{ background:'none', border:'none', color:C.accent, fontSize:13, cursor:'pointer', fontFamily:font, fontWeight:600, marginTop:4 }}>
              {t.hero.signIn}
            </button>
          </div>
        </div>
      </section>

      {/* ── PRODUCT SCREENSHOTS ───────────────────────────────────────────────── */}
      <section style={{ padding:'20px 24px 80px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:24 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:C.accent, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12, textAlign:'center' }}>👥 Contact Management</div>
            <ContactMockup/>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:C.accent, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12, textAlign:'center' }}>🏛️ Booth Management</div>
            <BoothMockup/>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding:'80px 24px', background:'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.accent, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>{t.features.badge}</div>
            <h2 style={{ margin:'0 0 12px', fontSize:'clamp(24px,4vw,40px)', fontWeight:800, color:C.white, letterSpacing:'-0.02em' }}>{t.features.title}</h2>
            <p style={{ fontSize:16, color:C.textSub, maxWidth:500, margin:'0 auto' }}>{t.features.subtitle}</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>
            {t.features.items.map((f,i) => (
              <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:16, padding:28, transition:'border-color .2s',
                onMouseEnter: e => e.currentTarget.style.borderColor=C.border2,
                onMouseLeave: e => e.currentTarget.style.borderColor=C.border,
              }}>
                <div style={{ fontSize:36, marginBottom:16 }}>{f.icon}</div>
                <div style={{ fontSize:17, fontWeight:700, color:C.white, marginBottom:4 }}>{f.title}</div>
                <div style={{ fontSize:12, color:C.accent, marginBottom:12, fontWeight:500 }}>{f.hi}</div>
                <div style={{ fontSize:14, color:C.textSub, lineHeight:1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section id="how" style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.accent, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>{t.howItWorks.badge}</div>
            <h2 style={{ margin:0, fontSize:'clamp(24px,4vw,40px)', fontWeight:800, color:C.white, letterSpacing:'-0.02em' }}>{t.howItWorks.title}</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20 }}>
            {t.howItWorks.steps.map((s,i) => (
              <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:16, padding:28, textAlign:'center' }}>
                <div style={{ fontSize:36, fontWeight:800, color:C.primary, marginBottom:16, letterSpacing:'-0.03em' }}>{s.n}</div>
                <div style={{ fontSize:17, fontWeight:700, color:C.white, marginBottom:10 }}>{s.title}</div>
                <div style={{ fontSize:14, color:C.textSub, lineHeight:1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding:'80px 24px', background:'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.accent, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>{t.pricing.badge}</div>
            <h2 style={{ margin:'0 0 8px', fontSize:'clamp(24px,4vw,40px)', fontWeight:800, color:C.white, letterSpacing:'-0.02em' }}>{t.pricing.title}</h2>
            <p style={{ fontSize:15, color:C.textSub, margin:0 }}>{t.pricing.subtitle}</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20 }}>
            {injectPricing(t.pricing.plans).map((p,i) => (
              <div key={i} style={{ background: p.highlight ? `linear-gradient(135deg,rgba(108,99,255,0.2),rgba(79,70,229,0.1))` : C.bgCard, border:`${p.highlight ? 2 : 1}px solid ${p.highlight ? C.primary : C.border}`, borderRadius:20, padding:28, position:'relative', display:'flex', flexDirection:'column' }}>
                {p.badge && (
                  <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:C.primary, color:'#fff', fontSize:10, fontWeight:700, padding:'3px 14px', borderRadius:20, whiteSpace:'nowrap', letterSpacing:'0.05em' }}>{p.badge}</div>
                )}
                <div style={{ fontSize:16, fontWeight:700, color:C.white, marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:12, color:C.textSub, marginBottom:20 }}>{p.desc}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
                  <span style={{ fontSize:36, fontWeight:800, color:C.white, letterSpacing:'-0.03em' }}>{p.price}</span>
                  <span style={{ fontSize:14, color:C.textSub }}>{p.period}</span>
                </div>
                {i===1 && <div style={{ fontSize:11, color:C.accent, marginBottom:16 }}>+ {premiumExtra}/mo per additional VS</div>}
                {i!==1 && <div style={{ marginBottom:16 }}/>}
                <div style={{ fontSize:12, color:C.textSub, marginBottom:4 }}>📍 {p.vs}</div>
                <div style={{ fontSize:12, color:C.textSub, marginBottom:20 }}>👥 {p.contacts}</div>
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16, marginBottom:20 }}>
                  {p.features.map((f,j) => (
                    <div key={j} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ color:C.success, fontSize:12 }}>✓</span>
                      <span style={{ fontSize:13, color:C.textSub }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (p.key !== 'free') {
                      sessionStorage.setItem('intended_plan', p.key)
                    }
                    setShowAuth(true)
                  }}
                  style={{ marginTop:'auto', padding:'12px', fontSize:14, fontWeight:700, background: p.highlight ? `linear-gradient(135deg,${C.primary},${C.primaryD})` : 'rgba(255,255,255,0.06)', border: p.highlight ? 'none' : `1px solid ${C.border2}`, borderRadius:10, color: p.highlight ? '#fff' : C.white, cursor:'pointer', fontFamily:font }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────────── */}
      <section style={{ padding:'100px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', bottom:-200, left:'50%', transform:'translateX(-50%)', width:500, height:500, background:`radial-gradient(circle,${C.primaryD}33 0%,transparent 70%)`, pointerEvents:'none' }}/>
        <div style={{ maxWidth:600, margin:'0 auto', position:'relative' }}>
          <h2 style={{ margin:'0 0 8px', fontSize:'clamp(28px,5vw,52px)', fontWeight:800, color:C.white, letterSpacing:'-0.03em', lineHeight:1.1 }}>
            {t.cta.title}<br/>{t.cta.title2}
          </h2>
          <div style={{ fontSize:18, color:C.accent, fontWeight:600, margin:'16px 0 36px', letterSpacing:'-0.01em' }}>{t.cta.sub}</div>
          <button onClick={() => setShowAuth(true)} style={{ padding:'18px 48px', fontSize:17, fontWeight:700, background:`linear-gradient(135deg,${C.primary},${C.primaryD})`, border:'none', borderRadius:14, color:'#fff', cursor:'pointer', fontFamily:font, boxShadow:`0 12px 40px ${C.primary}55`, letterSpacing:'-0.01em' }}>
            {t.cta.btn} →
          </button>
          <div style={{ fontSize:13, color:C.gray2, marginTop:14 }}>{t.cta.note}</div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:'32px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${C.primary},${C.primaryD})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🗳️</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.white }}>Sampark<span style={{ color:C.accent }}>.AI</span></div>
              <div style={{ fontSize:10, color:C.textSub }}>{t.footer.tagline}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:20 }}>
            {[
              { label: t.footer.links[0], page:'privacy' },
              { label: t.footer.links[1], page:'terms' },
              { label: t.footer.links[2], page:'contact' },
            ].map(({ label, page }) => (
              <button key={page} onClick={() => setShowPage(page)} style={{ background:'none', border:'none', fontSize:12, color:C.textSub, cursor:'pointer', fontFamily:font, padding:0 }}
                onMouseEnter={e => e.target.style.color=C.white}
                onMouseLeave={e => e.target.style.color=C.textSub}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ fontSize:12, color:C.gray2 }}>{t.footer.copy}</div>
        </div>
      </footer>

      {/* ── AUTH MODAL ────────────────────────────────────────────────────────── */}
      {showAuth && (
        <div
          onClick={e => e.target === e.currentTarget && setShowAuth(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
        >
          <div style={{ background:'#16152A', border:`1px solid ${C.border2}`, borderRadius:20, padding:32, width:'100%', maxWidth:400, boxShadow:'0 24px 80px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:800, color:C.white }}>Welcome to Sampark.AI</div>
                <div style={{ fontSize:12, color:C.textSub, marginTop:2 }}>संपर्क · Electoral Intelligence</div>
              </div>
              <button onClick={() => setShowAuth(false)} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', color:C.gray, fontSize:16, fontFamily:font }}>✕</button>
            </div>

            {/* Google */}
            <button onClick={googleLogin} style={{ width:'100%', padding:'12px', marginBottom:16, fontSize:14, fontWeight:600, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border2}`, borderRadius:10, color:C.white, cursor:'pointer', fontFamily:font, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71C3.784 10.17 3.682 9.59 3.682 9c0-.59.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ flex:1, height:'1px', background:C.border }}/>
              <span style={{ fontSize:12, color:C.gray2 }}>or continue with email</span>
              <div style={{ flex:1, height:'1px', background:C.border }}/>
            </div>

            {authStep === 'email' ? (
              <>
                <input
                  type="email" placeholder="Enter your email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && sendOTP()}
                  style={{ width:'100%', padding:'12px 14px', marginBottom:12, fontSize:14, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border2}`, borderRadius:10, color:C.white, fontFamily:font, boxSizing:'border-box', outline:'none' }}
                />
                {authError && <div style={{ color:'#EF4444', fontSize:12, marginBottom:10 }}>⚠ {authError}</div>}
                <button onClick={sendOTP} disabled={authLoading} style={{ width:'100%', padding:'13px', fontSize:14, fontWeight:700, background:`linear-gradient(135deg,${C.primary},${C.primaryD})`, border:'none', borderRadius:10, color:'#fff', cursor: authLoading ? 'not-allowed' : 'pointer', fontFamily:font, opacity: authLoading ? 0.7 : 1 }}>
                  {authLoading ? '⏳ Sending...' : 'Send OTP →'}
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize:13, color:C.textSub, marginBottom:12 }}>OTP sent to <strong style={{ color:C.white }}>{email}</strong></div>
                <input
                  type="text" placeholder="Enter 6-digit OTP" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && confirmOTP()}
                  style={{ width:'100%', padding:'12px 14px', marginBottom:12, fontSize:20, fontWeight:700, letterSpacing:'0.2em', textAlign:'center', background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border2}`, borderRadius:10, color:C.white, fontFamily:font, boxSizing:'border-box', outline:'none' }}
                />
                {authError && <div style={{ color:'#EF4444', fontSize:12, marginBottom:10 }}>⚠ {authError}</div>}
                <button onClick={confirmOTP} disabled={authLoading} style={{ width:'100%', padding:'13px', fontSize:14, fontWeight:700, background:`linear-gradient(135deg,${C.primary},${C.primaryD})`, border:'none', borderRadius:10, color:'#fff', cursor: authLoading ? 'not-allowed' : 'pointer', fontFamily:font, opacity: authLoading ? 0.7 : 1, marginBottom:10 }}>
                  {authLoading ? '⏳ Verifying...' : 'Verify & Sign In →'}
                </button>
                <button onClick={() => { setAuthStep('email'); setOtp(''); setAuthError('') }} style={{ background:'none', border:'none', color:C.gray, fontSize:12, cursor:'pointer', fontFamily:font, width:'100%' }}>
                  ← Change email
                </button>
              </>
            )}

            <div style={{ fontSize:11, color:C.gray2, textAlign:'center', marginTop:16, lineHeight:1.6 }}>
              By continuing you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
