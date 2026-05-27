// src/pages/TermsOfService.jsx
import { useEffect } from 'react'

const C = {
  bg:'#0F0E1A', bgCard:'#16152A', border:'rgba(255,255,255,0.08)',
  primary:'#6C63FF', accent:'#A78BFA', white:'#FFFFFF',
  gray:'#9CA3AF', gray2:'#6B7280', text:'#F1F0FF',
}
const font = "system-ui,-apple-system,'Segoe UI',sans-serif"

export default function TermsOfService({ onBack }) {
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
          <h1 style={{ margin:'0 0 8px', fontSize:'clamp(28px,4vw,40px)', fontWeight:800, color:C.white, letterSpacing:'-0.02em' }}>Terms of Service</h1>
          <div style={{ fontSize:13, color:C.gray2 }}>Last updated: January 1, 2025</div>
        </div>

        {[
          {
            title: '1. Acceptance of Terms',
            content: `By accessing or using Sampark.AI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.\n\nThese terms apply to all users, including free and paid subscribers.`
          },
          {
            title: '2. Description of Service',
            content: `Sampark.AI is an electoral contact management platform that allows political leaders and campaign managers to:\n\n• Manage voter contacts across constituencies\n• Track booth-level performance and ratings\n• Classify contacts by caste, loyalty, and other attributes\n• Manage multiple Vidhan Sabha constituencies\n• Generate electoral intelligence reports\n\nWe reserve the right to modify, suspend, or discontinue any aspect of the service at any time.`
          },
          {
            title: '3. Account Registration',
            content: `To use Sampark.AI you must:\n\n• Provide accurate and complete registration information\n• Maintain the security of your account credentials\n• Promptly notify us of any unauthorized access\n• Be at least 18 years of age\n• Use the service only for lawful purposes\n\nYou are responsible for all activities that occur under your account.`
          },

          {
            title: '4. Cancellation and Refunds',
            content: `Subscription Cancellation:\n• You may cancel your subscription at any time from your billing page\n• Access continues until the end of the current billing period\n• No partial refunds for unused portions of a billing period\n\nRefund Policy:\n• Refunds may be considered within 7 days of first payment if the service does not function as described\n• Technical issues causing significant service disruption may qualify for pro-rated refunds\n• Contact support@sampark.ai for refund requests\n\nWe reserve the right to refuse refunds in cases of Terms of Service violations.`
          },
          {
            title: '5. Acceptable Use',
            content: `You agree NOT to use Sampark.AI to:\n\n• Violate any applicable laws or regulations, including Election Commission of India guidelines\n• Store or process data obtained through illegal means\n• Harass, intimidate, or harm voters or political opponents\n• Spread misinformation or false electoral data\n• Attempt to hack, disrupt, or damage our systems\n• Resell or sublicense access to the service\n• Upload malicious code or content\n• Violate any individual's privacy rights\n\nViolation of these terms may result in immediate account termination without refund.`
          },
          {
            title: '6. Data Ownership',
            content: `You retain full ownership of all data you upload to Sampark.AI including:\n\n• Voter contact information\n• Booth data and ratings\n• Constituency information\n• Any reports or analytics generated\n\nBy uploading data, you grant us a limited license to process and store it solely for providing the service. We will never sell, share, or use your data for any other purpose.`
          },
          {
            title: '7. Intellectual Property',
            content: `Sampark.AI and its original content, features, and functionality are owned by us and are protected by intellectual property laws.\n\nYou may not:\n• Copy, modify, or distribute our platform code\n• Reverse engineer any part of the service\n• Use our brand, logo, or trademarks without written permission\n• Create derivative works based on our service`
          },
          {
            title: '8. Limitation of Liability',
            content: `To the maximum extent permitted by law, Sampark.AI shall not be liable for:\n\n• Any indirect, incidental, or consequential damages\n• Loss of data, profits, or business opportunities\n• Service interruptions or downtime\n• Actions taken based on electoral analytics provided\n• Unauthorized access to your account due to your negligence\n\nOur total liability in any matter is limited to the amount you paid us in the 3 months preceding the claim.`
          },
          {
            title: '9. Disclaimers',
            content: `The service is provided "as is" without warranties of any kind. We do not warrant that:\n\n• The service will be uninterrupted or error-free\n• Election analytics or predictions will be accurate\n• The service will meet all your specific requirements\n\nElectoral data and analytics are provided for informational purposes only. We are not responsible for any political decisions made based on our platform.`
          },
          {
            title: '10. Governing Law',
            content: `These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.\n\nAny disputes shall first be attempted to be resolved through mutual negotiation, failing which through arbitration under the Arbitration and Conciliation Act, 1996.`
          },
          {
            title: '11. Changes to Terms',
            content: `We reserve the right to modify these Terms at any time. We will provide notice of significant changes by:\n\n• Email notification to your registered address\n• Prominent notice on our platform\n• Updating the "Last updated" date\n\nYour continued use of the service after changes constitutes acceptance of the new terms.`
          },
          {
            title: '12. Contact',
            content: `For questions about these Terms of Service:\n\nEmail: legal@sampark.ai\nSupport: support@sampark.ai\n\nSampark.AI Electoral Intelligence Platform\nIndia`
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
