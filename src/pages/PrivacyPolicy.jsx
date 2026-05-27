// src/pages/PrivacyPolicy.jsx
import { useEffect } from 'react'

const C = {
  bg:'#0F0E1A', bgCard:'#16152A', border:'rgba(255,255,255,0.08)',
  primary:'#6C63FF', accent:'#A78BFA', white:'#FFFFFF',
  gray:'#9CA3AF', gray2:'#6B7280', text:'#F1F0FF',
}
const font = "system-ui,-apple-system,'Segoe UI',sans-serif"

export default function PrivacyPolicy({ onBack }) {
  useEffect(() => { window.scrollTo(0,0) }, [])

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:font, color:C.text }}>
      {/* Header */}
      <div style={{ background:'rgba(15,14,26,0.95)', borderBottom:`1px solid ${C.border}`, padding:'16px 24px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:800, margin:'0 auto', display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={onBack} style={{ background:'#6C63FF', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:font, boxShadow:'0 2px 8px rgba(108,99,255,.4)' }}>
            ← Back
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>🗳️</span>
            <span style={{ fontSize:15, fontWeight:700, color:C.white }}>Sampark<span style={{ color:C.accent }}>.AI</span></span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:800, margin:'0 auto', padding:'48px 24px 80px' }}>
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:12, color:C.accent, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Legal</div>
          <h1 style={{ margin:'0 0 8px', fontSize:'clamp(28px,4vw,40px)', fontWeight:800, color:C.white, letterSpacing:'-0.02em' }}>Privacy Policy</h1>
          <div style={{ fontSize:13, color:C.gray2 }}>Last updated: January 1, 2025</div>
        </div>

        {[
          {
            title: '1. Introduction',
            content: `Sampark.AI ("we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our electoral contact management platform.\n\nBy using Sampark.AI, you agree to the collection and use of information in accordance with this policy.`
          },
          {
            title: '2. Information We Collect',
            content: `We collect information you provide directly to us:\n\n• Account Information: Name, email address, phone number when you register\n• Contact Data: Voter contacts, booth information, and constituency data you add to the platform\n• Payment Information: Billing details processed securely through Razorpay (we do not store card numbers)\n• Usage Data: How you interact with our platform, features used, and time spent\n• Device Information: IP address, browser type, operating system`
          },
          {
            title: '3. How We Use Your Information',
            content: `We use the information we collect to:\n\n• Provide, operate, and maintain our services\n• Process payments and manage subscriptions\n• Send transactional emails (OTP, receipts, plan updates)\n• Improve and personalize your experience\n• Respond to your comments and questions\n• Monitor usage patterns to improve our platform\n• Comply with legal obligations`
          },
          {
            title: '4. Data Storage and Security',
            content: `Your data is stored securely on Supabase infrastructure with enterprise-grade security:\n\n• All data is encrypted in transit (TLS/SSL) and at rest\n• Row-level security ensures you can only access your own data\n• We use Supabase's PostgreSQL database hosted on AWS\n• Regular backups are maintained\n• We implement industry-standard security practices\n\nWhile we strive to protect your information, no method of transmission over the Internet is 100% secure.`
          },
          {
            title: '5. Data Sharing',
            content: `We do not sell, trade, or rent your personal information to third parties. We may share information with:\n\n• Service Providers: Supabase (database), Razorpay (payments), Google (authentication) — only as necessary to provide services\n• Legal Requirements: If required by law, court order, or government authority\n• Business Transfer: In case of merger, acquisition, or sale of assets\n\nAll third-party service providers are bound by confidentiality agreements.`
          },
          {
            title: '6. Contact Data Privacy',
            content: `The voter contact data you upload and manage on Sampark.AI:\n\n• Belongs entirely to you\n• Is never shared with other users or third parties\n• Is never used for advertising or marketing purposes\n• Can be exported or deleted at any time\n• Is protected by row-level security — only you can access it\n\nWe act as a data processor for your contact data. You remain the data controller.`
          },
          {
            title: '7. Cookies',
            content: `We use minimal cookies necessary for the platform to function:\n\n• Authentication cookies: To keep you logged in\n• Preference cookies: To remember your language preference\n\nWe do not use advertising cookies or third-party tracking cookies.`
          },
          {
            title: '8. Your Rights',
            content: `You have the right to:\n\n• Access: Request a copy of your personal data\n• Correction: Update inaccurate information\n• Deletion: Request deletion of your account and data\n• Export: Download all your data in standard formats\n• Opt-out: Unsubscribe from non-transactional communications\n\nTo exercise these rights, contact us at privacy@sampark.ai`
          },
          {
            title: '9. Data Retention',
            content: `We retain your data for as long as your account is active. If you delete your account:\n\n• Personal information is deleted within 30 days\n• Contact and constituency data is deleted immediately\n• Billing records are retained for 7 years as required by Indian tax law\n• Anonymized usage data may be retained for analytics`
          },
          {
            title: '10. Children\'s Privacy',
            content: `Sampark.AI is not directed to individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected such information, please contact us immediately.`
          },
          {
            title: '11. Changes to This Policy',
            content: `We may update this Privacy Policy from time to time. We will notify you of any changes by:\n\n• Updating the "Last updated" date at the top\n• Sending an email notification for material changes\n• Displaying a notice on our platform\n\nYour continued use of Sampark.AI after changes constitutes acceptance of the updated policy.`
          },
          {
            title: '12. Contact Us',
            content: `For privacy-related questions or concerns:\n\nEmail: privacy@sampark.ai\nSupport: support@sampark.ai\n\nWe will respond to all privacy requests within 30 days.`
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:18, fontWeight:700, color:C.white, marginBottom:12, letterSpacing:'-0.01em' }}>{section.title}</h2>
            <div style={{ fontSize:14, color:C.gray, lineHeight:1.8, whiteSpace:'pre-line' }}>{section.content}</div>
          </div>
        ))}

        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:24, marginTop:40, fontSize:13, color:C.gray2, textAlign:'center' }}>
          © 2025 Sampark.AI · Electoral Intelligence, Simplified.
        </div>
      </div>
    </div>
  )
}
