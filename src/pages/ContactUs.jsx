// src/pages/ContactUs.jsx
import { useState, useEffect } from 'react'

const C = {
  bg:'#0F0E1A', bgCard:'#16152A', border:'rgba(255,255,255,0.08)',
  border2:'rgba(255,255,255,0.15)', primary:'#6C63FF', primaryD:'#4F46E5',
  accent:'#A78BFA', white:'#FFFFFF', gray:'#9CA3AF', gray2:'#6B7280',
  text:'#F1F0FF', success:'#10B981', red:'#EF4444',
}
const font = "system-ui,-apple-system,'Segoe UI',sans-serif"

export default function ContactUs({ onBack }) {
  useEffect(() => { window.scrollTo(0,0) }, [])

  const [form, setForm]       = useState({ name:'', email:'', subject:'', message:'' })
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) { setError('Please fill all required fields'); return }
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError('Enter a valid email address'); return }
    setSending(true); setError('')
    // In production - connect to your email service (Resend, SendGrid etc)
    // For now simulate success
    await new Promise(r => setTimeout(r, 1500))
    setSent(true)
    setSending(false)
  }

  const inp = {
    width:'100%', padding:'12px 14px', fontSize:14,
    background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border2}`,
    borderRadius:10, color:C.white, fontFamily:font, outline:'none',
    boxSizing:'border-box',
  }

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:font, color:C.text }}>
      {/* Header */}
      <div style={{ background:'rgba(15,14,26,0.95)', borderBottom:`1px solid ${C.border}`, padding:'16px 24px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.08)', border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 14px', fontSize:13, color:C.gray, cursor:'pointer', fontFamily:font }}>
            ← Back
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>🗳️</span>
            <span style={{ fontSize:15, fontWeight:700, color:C.white }}>Sampark<span style={{ color:C.accent }}>.AI</span></span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'48px 24px 80px' }}>
        {/* Heading */}
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{ fontSize:12, color:C.accent, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Get in Touch</div>
          <h1 style={{ margin:'0 0 12px', fontSize:'clamp(28px,4vw,44px)', fontWeight:800, color:C.white, letterSpacing:'-0.02em' }}>Contact Us</h1>
          <p style={{ fontSize:16, color:C.gray, maxWidth:500, margin:'0 auto' }}>We're here to help. Reach out for support, sales, or anything else.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:32 }}>

          {/* Contact info */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[
              { icon:'📧', title:'Email Support', lines:['support@sampark.ai', 'Response within 24 hours'], link:'mailto:support@sampark.ai' },
              { icon:'💳', title:'Billing & Payments', lines:['billing@sampark.ai', 'For payment issues and invoices'], link:'mailto:billing@sampark.ai' },
              { icon:'⚖️', title:'Legal & Privacy', lines:['legal@sampark.ai', 'Privacy policy and legal queries'], link:'mailto:legal@sampark.ai' },
              { icon:'🚀', title:'Sales & Partnerships', lines:['sales@sampark.ai', 'Enterprise plans and partnerships'], link:'mailto:sales@sampark.ai' },
            ].map((item, i) => (
              <a key={i} href={item.link} style={{ textDecoration:'none' }}>
                <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:'18px 20px', display:'flex', gap:14, alignItems:'flex-start',
                  transition:'border-color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=C.border2}
                  onMouseLeave={e => e.currentTarget.style.borderColor=C.border}
                >
                  <div style={{ fontSize:24, flexShrink:0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.white, marginBottom:4 }}>{item.title}</div>
                    {item.lines.map((l,j) => (
                      <div key={j} style={{ fontSize:13, color: j===0 ? C.accent : C.gray2 }}>{l}</div>
                    ))}
                  </div>
                </div>
              </a>
            ))}

            {/* WhatsApp */}
            <div style={{ background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.2)', borderRadius:14, padding:'18px 20px', display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ fontSize:24, flexShrink:0 }}>💬</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.white, marginBottom:4 }}>WhatsApp Support</div>
                <div style={{ fontSize:13, color:'#25D366', fontWeight:600 }}>+91 98450 19977</div>
                <div style={{ fontSize:12, color:C.gray2, marginTop:2 }}>Mon–Sat, 10am–6pm IST</div>
              </div>
            </div>

            {/* Response time */}
            <div style={{ background:'rgba(108,99,255,0.08)', border:`1px solid rgba(108,99,255,0.2)`, borderRadius:14, padding:'16px 20px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.accent, marginBottom:8 }}>⏱ Response Times</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[
                  ['Technical support', '< 24 hours'],
                  ['Billing queries', '< 4 hours'],
                  ['Sales enquiries', '< 2 hours'],
                ].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ color:C.gray }}>{l}</span>
                    <span style={{ color:C.white, fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:16, padding:28 }}>
            {sent ? (
              <div style={{ textAlign:'center', padding:'40px 20px' }}>
                <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
                <div style={{ fontSize:20, fontWeight:800, color:C.white, marginBottom:8 }}>Message Sent!</div>
                <div style={{ fontSize:14, color:C.gray, lineHeight:1.7 }}>
                  Thank you for reaching out. We'll get back to you at <strong style={{ color:C.white }}>{form.email}</strong> within 24 hours.
                </div>
                <button onClick={() => { setSent(false); setForm({ name:'', email:'', subject:'', message:'' }) }} style={{ marginTop:20, padding:'10px 24px', fontSize:13, fontWeight:600, background:'rgba(255,255,255,0.08)', border:`1px solid ${C.border2}`, borderRadius:8, color:C.gray, cursor:'pointer', fontFamily:font }}>
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize:16, fontWeight:700, color:C.white, marginBottom:20 }}>Send us a message</div>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.gray, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Name *</label>
                      <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} placeholder="Your name" style={inp}/>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.gray, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Email *</label>
                      <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} placeholder="your@email.com" style={inp}/>
                    </div>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.gray, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Subject</label>
                    <select value={form.subject} onChange={e => setForm(f => ({...f, subject:e.target.value}))} style={{ ...inp, cursor:'pointer' }}>
                      <option value="">Select a topic...</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Billing & Payment">Billing & Payment</option>
                      <option value="Account Issue">Account Issue</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.gray, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Message *</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({...f, message:e.target.value}))}
                      placeholder="Describe your issue or question in detail..."
                      rows={5}
                      style={{ ...inp, resize:'vertical', lineHeight:1.6 }}
                    />
                  </div>
                  {error && <div style={{ fontSize:12, color:C.red }}>⚠ {error}</div>}
                  <button onClick={handleSubmit} disabled={sending} style={{
                    padding:'13px', fontSize:14, fontWeight:700,
                    background: sending ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${C.primary},${C.primaryD})`,
                    border:'none', borderRadius:10, color: sending ? C.gray : C.white,
                    cursor: sending ? 'not-allowed' : 'pointer', fontFamily:font,
                  }}>
                    {sending ? '⏳ Sending...' : 'Send Message →'}
                  </button>
                  <div style={{ fontSize:11, color:C.gray2, textAlign:'center' }}>
                    We typically respond within 24 hours on business days.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
