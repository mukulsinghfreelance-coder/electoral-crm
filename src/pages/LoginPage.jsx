import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const C = {
  primary:"#4F46E5", primaryDark:"#3730A3", primaryLight:"#EEF2FF",
  success:"#059669", red:"#DC2626", gray200:"#E5E7EB",
  gray400:"#9CA3AF", gray600:"#4B5563", gray900:"#111827", white:"#FFFFFF",
}

export default function LoginPage() {
  const { login, verify } = useAuth()
  const [step,    setStep]    = useState('email')   // 'email' | 'otp'
  const [email,   setEmail]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [resent,  setResent]  = useState(false)

  const handleSendOTP = async () => {
    if (!email.trim()) { setError('Please enter your email'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email'); return }
    setLoading(true); setError('')
    try {
      await login(email.trim().toLowerCase())
      setStep('otp')
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Try again.')
    }
    setLoading(false)
  }

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 6) { setError('Please enter the 6-digit OTP'); return }
    setLoading(true); setError('')
    try {
      await verify(email.trim().toLowerCase(), otp.trim())
      // AuthContext handles redirect via onAuthStateChange
    } catch (err) {
      setError('Invalid or expired OTP. Please try again.')
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setLoading(true); setError(''); setResent(false)
    try {
      await login(email.trim().toLowerCase())
      setResent(true); setOtp('')
    } catch (err) {
      setError('Failed to resend. Try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight:'100vh', width:'100%',
      background:'linear-gradient(135deg,#1E1B4B 0%,#312E81 40%,#4F46E5 100%)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px', fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    }}>
      <div style={{width:'100%', maxWidth:420}}>

        {/* Logo */}
        <div style={{textAlign:'center', marginBottom:32}}>
          <div style={{
            width:72, height:72, borderRadius:20,
            background:'rgba(255,255,255,.15)',
            backdropFilter:'blur(10px)',
            border:'2px solid rgba(255,255,255,.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:36, margin:'0 auto 16px',
          }}>
            📋
          </div>
          <div style={{fontSize:28, fontWeight:800, color:C.white, letterSpacing:'-.5px'}}>
            ContactBook
          </div>
          <div style={{fontSize:14, color:'#A5B4FC', marginTop:4, fontWeight:500}}>
            Electoral Manager
          </div>
        </div>

        {/* Card */}
        <div style={{
          background:C.white, borderRadius:20,
          boxShadow:'0 24px 64px rgba(0,0,0,.25)',
          padding:'32px 28px',
        }}>

          {step === 'email' ? (
            <>
              <div style={{fontSize:20, fontWeight:800, color:C.gray900, marginBottom:6}}>
                Welcome back 👋
              </div>
              <div style={{fontSize:13, color:C.gray600, marginBottom:24, lineHeight:1.6}}>
                Enter your registered email to receive a one-time login code.
              </div>

              <div style={{marginBottom:16}}>
                <label style={{display:'block', fontSize:11, fontWeight:700, color:C.gray400, marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em'}}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                  placeholder="yourname@gmail.com"
                  autoFocus
                  style={{
                    width:'100%', padding:'12px 14px', fontSize:14,
                    border:`2px solid ${error ? C.red : C.gray200}`,
                    borderRadius:10, outline:'none', color:C.gray900,
                    background:'#FAFAFA', transition:'border .15s',
                    boxSizing:'border-box',
                  }}
                />
              </div>

              {error && (
                <div style={{color:C.red, fontSize:12, fontWeight:500, marginBottom:12}}>
                  ⚠ {error}
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={loading}
                style={{
                  width:'100%', padding:'13px',
                  background:loading ? C.gray400 : `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                  color:C.white, border:'none', borderRadius:10,
                  fontSize:15, fontWeight:700, cursor:loading ? 'not-allowed' : 'pointer',
                  boxShadow:loading ? 'none' : '0 6px 20px rgba(79,70,229,.4)',
                  transition:'all .2s', fontFamily:'inherit',
                }}
              >
                {loading ? '⏳ Sending…' : 'Send OTP →'}
              </button>

              <div style={{
                background:C.primaryLight, borderRadius:10,
                padding:'10px 14px', marginTop:20,
                fontSize:12, color:C.primary, lineHeight:1.7,
              }}>
                📌 Your email must be registered by your team leader. Contact your admin if you can't login.
              </div>
            </>
          ) : (
            <>
              <div style={{fontSize:20, fontWeight:800, color:C.gray900, marginBottom:6}}>
                Check your email 📧
              </div>
              <div style={{fontSize:13, color:C.gray600, marginBottom:4, lineHeight:1.6}}>
                We sent a 6-digit code to
              </div>
              <div style={{fontSize:14, fontWeight:700, color:C.primary, marginBottom:24}}>
                {email}
              </div>

              {resent && (
                <div style={{background:'#D1FAE5', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:12, color:'#065F46', fontWeight:500}}>
                  ✅ New OTP sent successfully!
                </div>
              )}

              <div style={{marginBottom:16}}>
                <label style={{display:'block', fontSize:11, fontWeight:700, color:C.gray400, marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em'}}>
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  style={{
                    width:'100%', padding:'12px 14px', fontSize:22,
                    fontWeight:700, letterSpacing:8, textAlign:'center',
                    border:`2px solid ${error ? C.red : C.gray200}`,
                    borderRadius:10, outline:'none', color:C.gray900,
                    background:'#FAFAFA', transition:'border .15s',
                    boxSizing:'border-box',
                  }}
                />
              </div>

              {error && (
                <div style={{color:C.red, fontSize:12, fontWeight:500, marginBottom:12}}>
                  ⚠ {error}
                </div>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length < 6}
                style={{
                  width:'100%', padding:'13px',
                  background:(loading || otp.length < 6) ? C.gray400 : `linear-gradient(135deg,${C.success},#047857)`,
                  color:C.white, border:'none', borderRadius:10,
                  fontSize:15, fontWeight:700,
                  cursor:(loading || otp.length < 6) ? 'not-allowed' : 'pointer',
                  boxShadow:(loading || otp.length < 6) ? 'none' : '0 6px 20px rgba(5,150,105,.35)',
                  transition:'all .2s', fontFamily:'inherit',
                }}
              >
                {loading ? '⏳ Verifying…' : '✓ Verify & Login'}
              </button>

              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:20}}>
                <button
                  onClick={() => { setStep('email'); setOtp(''); setError(''); setResent(false) }}
                  style={{background:'none', border:'none', color:C.gray600, fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:500}}
                >
                  ← Change email
                </button>
                <button
                  onClick={handleResend}
                  disabled={loading}
                  style={{background:'none', border:'none', color:C.primary, fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:600}}
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{textAlign:'center', marginTop:20, fontSize:12, color:'#A5B4FC'}}>
          © 2025 ContactBook Electoral Manager
        </div>
      </div>
    </div>
  )
}
