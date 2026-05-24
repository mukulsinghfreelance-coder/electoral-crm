import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchStates, fetchLokSabhas, fetchVidhanSabhas } from '../lib/supabase'
import { PLANS, calcMonthlyPrice, formatPrice, APP } from '../config'

const C = {
  primary:'#4F46E5', primaryDark:'#3730A3', primaryLight:'#EEF2FF',
  success:'#059669', red:'#DC2626',
  gray100:'#F3F4F6', gray200:'#E5E7EB', gray400:'#9CA3AF',
  gray600:'#4B5563', gray900:'#111827', white:'#FFFFFF',
}

const PLAN_INFO = Object.entries(PLANS).map(([key, p]) => ({
  key,
  name:      p.label,
  vs:        p.vs === Infinity ? 'Unlimited' : p.vs,
  contacts:  p.contacts === Infinity ? 'Unlimited' : p.contacts.toLocaleString('en-IN'),
  price:     p.basePrice === 0 ? '₹0' : `₹${p.basePrice.toLocaleString('en-IN')}/mo`,
  extraVS:   p.extraVS > 0 ? `+₹${p.extraVS.toLocaleString('en-IN')}/mo per extra VS` : null,
  note:      p.description,
  highlight: p.highlight,
}))

// ─── OTP LOGIN MODAL ──────────────────────────────────────────────────────────
function OTPModal({ onClose, onSuccess }) {
  const { loginWithOTP, verifyOTP, loginWithGoogle, devLogin } = useAuth()
  const [step,    setStep]    = useState('email')
  const [email,   setEmail]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [resent,  setResent]  = useState(false)

  const sendOTP = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return }
    setLoading(true); setError('')
    try {
      await loginWithOTP(email.trim().toLowerCase())
      setStep('otp')
    } catch(e) {
      if (e.message?.includes('429') || e.status === 429 || e.message?.toLowerCase().includes('rate limit') || e.message?.toLowerCase().includes('too many')) {
        setError('Too many OTP requests. Please wait 60 seconds before trying again.')
      } else {
        setError(e.message || 'Failed to send OTP. Try again.')
      }
    }
    setLoading(false)
  }

  const verify = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true); setError('')
    try { await verifyOTP(email.trim().toLowerCase(), otp.trim()); onSuccess() }
    catch(e) { setError('Invalid or expired OTP') }
    setLoading(false)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, background:'rgba(17,24,39,.7)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:2000, padding:20, backdropFilter:'blur(4px)',
    }}>
      <div style={{ background:C.white, borderRadius:20, padding:'32px 28px', width:'100%', maxWidth:400, boxShadow:'0 24px 64px rgba(0,0,0,.25)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div style={{ fontSize:20, fontWeight:800, color:C.gray900 }}>
            {step === 'email' ? 'Sign In / Sign Up' : 'Check your email 📧'}
          </div>
          <button onClick={onClose} style={{ background:C.gray100, border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:16, color:C.gray600 }}>✕</button>
        </div>

        {step === 'email' ? (
          <>
            {/* Google */}
            <button
              onClick={loginWithGoogle}
              style={{
                width:'100%', padding:'12px', marginBottom:16, fontSize:14, fontWeight:600,
                background:C.white, border:`2px solid ${C.gray200}`, borderRadius:10,
                cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center',
                justifyContent:'center', gap:10, color:C.gray900, transition:'all .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.gray200}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71C3.784 10.17 3.682 9.59 3.682 9c0-.59.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ flex:1, height:1, background:C.gray200 }}/>
              <span style={{ fontSize:12, color:C.gray400, fontWeight:500 }}>or use email OTP</span>
              <div style={{ flex:1, height:1, background:C.gray200 }}/>
            </div>

            <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.gray400, marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>Email address</label>
            <input
              type="email" value={email} autoFocus
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && sendOTP()}
              placeholder="yourname@gmail.com"
              style={{ width:'100%', padding:'11px 13px', fontSize:14, border:`2px solid ${error ? C.red : C.gray200}`, borderRadius:10, outline:'none', color:C.gray900, boxSizing:'border-box', marginBottom:12, fontFamily:'inherit' }}
            />
            {error && <div style={{ color:C.red, fontSize:12, marginBottom:10 }}>⚠ {error}</div>}
            <button onClick={sendOTP} disabled={loading} style={{
              width:'100%', padding:13, background:loading ? C.gray400 : `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
              color:C.white, border:'none', borderRadius:10, fontSize:15, fontWeight:700,
              cursor:loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
            }}>
              {loading ? '⏳ Sending…' : 'Send OTP →'}
            </button>
            <div style={{ background:C.primaryLight, borderRadius:8, padding:'10px 12px', marginTop:14, fontSize:12, color:C.primary, lineHeight:1.6 }}>
              📌 New here? You'll be registered automatically. Select your constituencies first on this page before signing in.
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize:13, color:C.gray600, marginBottom:4 }}>We sent a 6-digit code to</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.primary, marginBottom:20 }}>{email}</div>
            {resent && <div style={{ background:'#D1FAE5', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:12, color:'#065F46', fontWeight:500 }}>✅ New OTP sent!</div>}
            <input
              type="text" value={otp} autoFocus maxLength={6}
              onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setError('') }}
              onKeyDown={e => e.key === 'Enter' && verify()}
              placeholder="000000"
              style={{ width:'100%', padding:'12px 14px', fontSize:24, fontWeight:700, letterSpacing:8, textAlign:'center', border:`2px solid ${error ? C.red : C.gray200}`, borderRadius:10, outline:'none', color:C.gray900, boxSizing:'border-box', marginBottom:12, fontFamily:'inherit' }}
            />
            {error && <div style={{ color:C.red, fontSize:12, marginBottom:10 }}>⚠ {error}</div>}
            <button onClick={verify} disabled={loading || otp.length < 6} style={{
              width:'100%', padding:13, fontSize:15, fontWeight:700, border:'none', borderRadius:10,
              background:(loading || otp.length < 6) ? C.gray400 : `linear-gradient(135deg,${C.success},#047857)`,
              color:C.white, cursor:(loading || otp.length < 6) ? 'not-allowed' : 'pointer', fontFamily:'inherit',
            }}>
              {loading ? '⏳ Verifying…' : '✓ Verify & Enter'}
            </button>
            {/* DEV MODE ONLY — remove before production */}
            {import.meta.env.DEV && step === 'otp' && (
              <div style={{ marginTop:16, background:'#FEF3C7', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#92400E' }}>
                <strong>🛠️ Dev Mode:</strong> Check Supabase Auth → Users for the OTP, or use{' '}
                <button onClick={async () => { setLoading(true); try { await devLogin(email) } catch(e){ setError(e.message) } setLoading(false) }} style={{ background:'none', border:'none', color:'#92400E', fontWeight:700, cursor:'pointer', textDecoration:'underline', fontSize:12, fontFamily:'inherit', padding:0 }}>
                  Password Login
                </button>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:16 }}>
              <button onClick={() => { setStep('email'); setOtp(''); setError('') }} style={{ background:'none', border:'none', color:C.gray600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>← Change email</button>
              <button onClick={async () => { setLoading(true); setResent(false); try { await loginWithOTP(email); setResent(true); setOtp('') } catch(e){} setLoading(false) }} disabled={loading} style={{ background:'none', border:'none', color:C.primary, fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Resend OTP</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────
export default function LandingPage() {
  const { loginWithGoogle } = useAuth()

  // Constituency selector state
  const [states,       setStates]       = useState([])
  const [lokSabhas,    setLokSabhas]    = useState([])
  const [vidhanSabhas, setVidhanSabhas] = useState([])
  const [selState,     setSelState]     = useState('')
  const [selLS,        setSelLS]        = useState('')
  const [selVS,        setSelVS]        = useState(null)   // { id, vidhan_sabha }
  const [cart,         setCart]         = useState([])     // array of { id, state, ls, vs }
  const [loadingData,  setLoadingData]  = useState(false)
  const [showOTP,      setShowOTP]      = useState(false)
  const [cartError,    setCartError]    = useState('')

  // Load states on mount
  useEffect(() => {
    fetchStates().then(setStates).catch(console.error)
  }, [])

  // Load LS when state changes
  useEffect(() => {
    if (!selState) { setLokSabhas([]); setSelLS(''); setVidhanSabhas([]); setSelVS(null); return }
    setLoadingData(true)
    fetchLokSabhas(selState).then(ls => { setLokSabhas(ls); setSelLS(''); setVidhanSabhas([]); setSelVS(null) }).finally(() => setLoadingData(false))
  }, [selState])

  // Load VS when LS changes
  useEffect(() => {
    if (!selState || !selLS) { setVidhanSabhas([]); setSelVS(null); return }
    setLoadingData(true)
    fetchVidhanSabhas(selState, selLS).then(vs => { setVidhanSabhas(vs); setSelVS(null) }).finally(() => setLoadingData(false))
  }, [selState, selLS])

  const addToCart = () => {
    if (!selVS) return
    setCartError('')
    // No hard cap — Multiple plan is open-ended
    if (cart.find(c => c.id === selVS.id)) { setCartError('Already added'); return }
    // No LS restriction — any constituency can be added
    setCart(prev => [...prev, { id: selVS.id, state: selState, ls: selLS, vs: selVS.vidhan_sabha }])
    setSelVS(null)
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id))

  const handleGetStarted = () => {
    if (cart.length === 0) { setCartError('Please select at least one constituency'); return }
    // Store cart in sessionStorage so auth flow can pick it up
    sessionStorage.setItem('pending_constituencies', JSON.stringify(cart))
    setShowOTP(true)
  }

  const handleSignedIn = () => {
    setShowOTP(false)
    // AppRouter auto-redirects when auth state changes
  }

  const handleGoogleSignIn = () => {
    if (cart.length > 0) {
      sessionStorage.setItem('pending_constituencies', JSON.stringify(cart))
    }
    loginWithGoogle()
  }

  const selStyle = {
    width:'100%', padding:'11px 13px', fontSize:14,
    border:`1.5px solid ${C.gray200}`, borderRadius:10,
    background:C.white, color:C.gray900, outline:'none',
    fontFamily:'inherit', cursor:'pointer',
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(160deg,#0F0C29 0%,#1a1560 40%,#302b63 70%,#24243e 100%)',
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
      overflowX:'hidden',
    }}>

      {/* ── NAV ── */}
      <nav style={{ padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📋</div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:'#fff', lineHeight:1 }}>ContactBook</div>
            <div style={{ fontSize:10, color:'#A5B4FC', fontWeight:500 }}>Electoral Manager</div>
          </div>
        </div>
        <button
          onClick={() => setShowOTP(true)}
          style={{ padding:'9px 20px', fontSize:13, fontWeight:700, background:'rgba(255,255,255,.1)', border:'1.5px solid rgba(255,255,255,.25)', borderRadius:10, color:'#C7D2FE', cursor:'pointer', fontFamily:'inherit', transition:'all .2s' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.1)' }}
        >
          Sign In →
        </button>
      </nav>

      {/* ── HERO ── */}
      <div style={{ textAlign:'center', padding:'40px 24px 20px', maxWidth:700, margin:'0 auto' }}>
        <div style={{
          display:'inline-block', background:'rgba(99,102,241,.3)',
          border:'1px solid rgba(165,180,252,.4)', borderRadius:30,
          padding:'6px 16px', fontSize:12, color:'#A5B4FC', fontWeight:600,
          marginBottom:20, letterSpacing:'.04em',
        }}>
          🗳️ INDIA'S ELECTORAL CONTACT MANAGEMENT PLATFORM
        </div>
        <h1 style={{
          fontSize:'clamp(28px,5vw,52px)', fontWeight:900, color:'#fff',
          margin:'0 0 16px', lineHeight:1.15, letterSpacing:'-.5px',
        }}>
          Manage Your Constituency<br/>
          <span style={{ background:'linear-gradient(90deg,#818CF8,#C084FC)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Like a Pro
          </span>
        </h1>
        <p style={{ fontSize:16, color:'#A5B4FC', lineHeight:1.7, margin:'0 0 32px', maxWidth:500, marginLeft:'auto', marginRight:'auto' }}>
          Track voters, manage booths, organise your Karyakartas — all in one place. Trusted by leaders across India.
        </p>
      </div>

      {/* ── MAIN CARD ── */}
      <div style={{ maxWidth:580, margin:'0 auto', padding:'0 16px 60px' }}>
        <div style={{
          background:'rgba(255,255,255,.97)', borderRadius:24,
          boxShadow:'0 32px 80px rgba(0,0,0,.4)',
          overflow:'hidden',
        }}>

          {/* Card header */}
          <div style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding:'20px 24px' }}>
            <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>Find your constituency</div>
            <div style={{ fontSize:13, color:'#C7D2FE', marginTop:4 }}>Select your Vidhan Sabha to get started</div>
          </div>

          <div style={{ padding:'24px' }}>

            {/* ── SELECTORS ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>

              {/* State */}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.gray400, marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>State</label>
                <select value={selState} onChange={e => setSelState(e.target.value)} style={selStyle}>
                  <option value="">Select State…</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Lok Sabha */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.gray400, marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>Lok Sabha</label>
                <select value={selLS} onChange={e => setSelLS(e.target.value)} disabled={!lokSabhas.length} style={{ ...selStyle, opacity: lokSabhas.length ? 1 : .5 }}>
                  <option value="">Select LS…</option>
                  {lokSabhas.map(ls => <option key={ls} value={ls}>{ls}</option>)}
                </select>
              </div>

              {/* Vidhan Sabha */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.gray400, marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>Vidhan Sabha</label>
                <select
                  value={selVS?.id || ''}
                  onChange={e => {
                    const found = vidhanSabhas.find(v => v.id === e.target.value)
                    setSelVS(found || null)
                    setCartError('')
                  }}
                  disabled={!vidhanSabhas.length}
                  style={{ ...selStyle, opacity: vidhanSabhas.length ? 1 : .5 }}
                >
                  <option value="">Select VS…</option>
                  {vidhanSabhas.map(vs => (
                    <option key={vs.id} value={vs.id} disabled={!!cart.find(c => c.id === vs.id)}>
                      {vs.vidhan_sabha}{cart.find(c => c.id === vs.id) ? ' ✓' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingData && <div style={{ fontSize:12, color:C.gray400, marginBottom:8 }}>⏳ Loading…</div>}

            {/* Add button */}
            <button
              onClick={addToCart}
              disabled={!selVS}
              style={{
                width:'100%', padding:'10px', fontSize:13, fontWeight:700,
                background: selVS ? `linear-gradient(135deg,${C.success},#047857)` : C.gray200,
                color: selVS ? C.white : C.gray400,
                border:'none', borderRadius:10, cursor: selVS ? 'pointer' : 'not-allowed',
                fontFamily:'inherit', marginBottom:16, transition:'all .2s',
              }}
            >
              + Add to my list
            </button>

            {cartError && <div style={{ color:C.red, fontSize:12, marginBottom:12, fontWeight:500 }}>⚠ {cartError}</div>}

            {/* ── CART ── */}
            {cart.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.gray400, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>
                  Your selected constituencies ({cart.length} selected)
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {cart.map(c => (
                    <div key={c.id} style={{
                      display:'inline-flex', alignItems:'center', gap:6,
                      background:C.primaryLight, border:`1.5px solid ${C.primary}33`,
                      borderRadius:30, padding:'6px 12px 6px 14px',
                      fontSize:13, fontWeight:700, color:C.primary,
                    }}>
                      🏛️ {c.vs}
                      <button
                        onClick={() => removeFromCart(c.id)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:C.primary, fontSize:14, lineHeight:1, padding:0, display:'flex', alignItems:'center' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {true && (
                    <div style={{ display:'inline-flex', alignItems:'center', fontSize:12, color:C.gray400, padding:'6px 10px', border:`1.5px dashed ${C.gray200}`, borderRadius:30 }}>
                      + Add more
                    </div>
                  )}
                </div>

                {/* Plan hint */}
                {cart.length === 1 && (
                  <div style={{ background:'#D1FAE5', borderRadius:8, padding:'8px 12px', marginTop:10, fontSize:12, color:'#065F46', fontWeight:500 }}>
                    ✅ 1 VS — Free plan available, or Single at ₹2,999/mo for unlimited contacts.
                  </div>
                )}
                {cart.length > 1 && (
                  <div style={{ background:'#EEF2FF', borderRadius:8, padding:'8px 12px', marginTop:10, fontSize:12, color:'#3730A3', fontWeight:500 }}>
                    ⚡ {cart.length} VSs — Multiple plan: ₹{(2999 + (cart.length-1)*2249).toLocaleString('en-IN')}/mo estimated
                  </div>
                )}
              </div>
            )}

            {/* ── CTA ── */}
            <button
              onClick={handleGetStarted}
              style={{
                width:'100%', padding:'14px', fontSize:16, fontWeight:800,
                background: cart.length > 0 ? `linear-gradient(135deg,${C.primary},${C.primaryDark})` : C.gray200,
                color: cart.length > 0 ? C.white : C.gray400,
                border:'none', borderRadius:12, cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                fontFamily:'inherit', boxShadow: cart.length > 0 ? `0 8px 24px rgba(79,70,229,.4)` : 'none',
                transition:'all .2s', marginBottom:12,
              }}
            >
              {cart.length === 0 ? 'Select a constituency to continue' : `🚀 Get Started — Sign Up / Sign In`}
            </button>

            <div style={{ textAlign:'center', fontSize:13, color:C.gray600 }}>
              Already registered?{' '}
              <button onClick={() => setShowOTP(true)} style={{ background:'none', border:'none', color:C.primary, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
                Sign In directly →
              </button>
            </div>
          </div>
        </div>

        {/* ── PLANS ── */}
        <div style={{ marginTop:48 }}>
          <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:'#A5B4FC', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:20 }}>
            Simple, transparent pricing
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {PLAN_INFO.map(p => (
              <div key={p.name} style={{
                background: p.highlight ? 'rgba(79,70,229,.3)' : 'rgba(255,255,255,.08)',
                backdropFilter:'blur(10px)',
                border: p.highlight ? '1px solid rgba(165,180,252,.5)' : '1px solid rgba(255,255,255,.12)',
                borderRadius:14, padding:'16px', textAlign:'center', position:'relative',
              }}>
                {p.highlight && <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', background:'#818CF8', color:'#fff', fontSize:9, fontWeight:700, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap', letterSpacing:'.05em' }}>MOST POPULAR</div>}
                <div style={{ fontSize:12, fontWeight:700, color:'#A5B4FC', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>{p.name}</div>
                <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:2 }}>{p.price}</div>
                {p.extraVS && <div style={{ fontSize:10, color:'#818CF8', marginBottom:4 }}>{p.extraVS}</div>}
                <div style={{ fontSize:11, color:'#818CF8' }}>{p.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginTop:32 }}>
          {[
            ['📊','Booth Analytics','Track ratings, voters, caste data per booth'],
            ['👥','Contact Manager','Manage Karyakartas, supporters & voters'],
            ['🗺️','Multi-constituency','Manage multiple VSs from one dashboard'],
            ['📱','Mobile Ready','Works perfectly on your phone, anytime'],
          ].map(([ic, title, desc]) => (
            <div key={title} style={{ background:'rgba(255,255,255,.06)', borderRadius:14, padding:16, border:'1px solid rgba(255,255,255,.1)' }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{ic}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>{title}</div>
              <div style={{ fontSize:11, color:'#818CF8', lineHeight:1.5 }}>{desc}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:32, fontSize:12, color:'rgba(165,180,252,.5)' }}>
          © 2025 ContactBook Electoral Manager · Made in India 🇮🇳
        </div>
      </div>

      {/* ── OTP MODAL ── */}
      {showOTP && <OTPModal onClose={() => setShowOTP(false)} onSuccess={handleSignedIn} />}
    </div>
  )
}
