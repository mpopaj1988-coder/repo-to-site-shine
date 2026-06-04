import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/guestgrowth/')({
  head: () => ({
    meta: [
      { title: 'GuestGrowth QR System — Turn WiFi Into a Guest List' },
      {
        name: 'description',
        content:
          'Stop losing guests to Airbnb forever. One QR code captures every guest email — so you can re-book direct, skip the fees, and build a business you own.',
      },
    ],
  }),
  component: GuestGrowthPage,
})

const PRICING_TIERS = [
  {
    id: 'qr-guide',
    name: 'QR Guest Guide',
    price: '$299',
    description: 'One-time setup',
    features: [
      'Custom QR code for your property',
      'Mobile-optimized guest guide page',
      'WiFi credentials reveal',
      'House rules & check-in steps',
      'Local recommendations section',
      'Book Direct CTA built in',
    ],
    cta: 'Get My QR Guide',
    highlighted: false,
  },
  {
    id: 'email-automation',
    name: 'QR Guide + Email Capture',
    price: '$399',
    description: 'One-time setup — most popular',
    features: [
      'Everything in QR Guest Guide',
      'Email gate before WiFi reveal',
      'Builds your guest email list automatically',
      'MailerLite automation setup',
      'Welcome email to every new guest',
      'Re-booking campaign (10% off direct)',
    ],
    cta: 'Get Email Automation',
    highlighted: true,
  },
  {
    id: 'full-site',
    name: 'Direct Booking Website',
    price: '$999+',
    description: 'Custom quote',
    features: [
      'Everything in Email Automation',
      'Full direct booking website',
      'Live pricing & availability sync',
      'SEO-optimized property pages',
      'Accept payments direct (no Airbnb cut)',
      'Ongoing support available',
    ],
    cta: 'Get a Custom Quote',
    highlighted: false,
  },
]

const COMPARISON_DATA = [
  { feature: 'Works on any phone — no app needed', us: true, guidebook: false, wifiOnly: false },
  { feature: 'Captures guest email automatically', us: true, guidebook: false, wifiOnly: false },
  { feature: 'Re-booking campaign built in', us: true, guidebook: false, wifiOnly: false },
  { feature: 'House rules & local recommendations', us: true, guidebook: true, wifiOnly: false },
  { feature: 'WiFi password delivery', us: true, guidebook: false, wifiOnly: true },
  { feature: 'Book Direct CTA to bypass Airbnb', us: true, guidebook: false, wifiOnly: false },
  { feature: 'Update info instantly (no reprint)', us: true, guidebook: false, wifiOnly: true },
  { feature: 'Works across unlimited stays', us: true, guidebook: true, wifiOnly: true },
]

const FAQ_ITEMS = [
  {
    q: 'How does the QR code work?',
    a: 'You print a small card (or frame) with the QR code and leave it at your property. Guests scan it when they arrive, enter their email to reveal the WiFi password, and get a mobile-friendly guide with your house rules and local tips. You get their email.',
  },
  {
    q: "Does this violate Airbnb's terms of service?",
    a: "No. You're not soliciting bookings during an active stay or using Airbnb's messaging system. Guests voluntarily scan the QR code at your property. The Book Direct CTA only shows after their stay, in follow-up emails they opted into.",
  },
  {
    q: 'What if guests skip the email gate?',
    a: "We add a 'Skip' option so guests always get the WiFi. Most guests enter their email because they want the guide — conversion rates are typically 60–80%. You keep every email you do capture.",
  },
  {
    q: 'How long does setup take?',
    a: "Once you send us your property info, we deliver within 3–5 business days. You print your QR card, place it at the property, and it's live.",
  },
  {
    q: 'Do I need any technical knowledge?',
    a: "None. You print a card, place it at the property, and we handle everything else. You log into a simple dashboard to see your guest email list grow.",
  },
  {
    q: 'Can I use this for multiple properties?',
    a: 'Yes — each property gets its own QR code and guide page. Contact us for multi-property pricing.',
  },
]

const PAIN_CARDS = [
  {
    stat: '$4,200',
    label: 'Average host pays Airbnb every year',
    detail: "That's 15–20% of every booking, plus the guest service fee your guests pay too.",
  },
  {
    stat: '0 emails',
    label: 'You own after 47 avg guest stays',
    detail: "Airbnb owns the relationship. When a guest loves your place, they go back to Airbnb — not you.",
  },
  {
    stat: '3×',
    label: 'More revenue from repeat vs new guests',
    detail: "Repeat guests cost nothing to acquire and book direct. One email list changes everything.",
  },
]

function CheckIcon({ color = '#22c55e' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="9" fill={color} fillOpacity="0.15" />
      <path d="M5 9l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="9" fill="#ef4444" fillOpacity="0.12" />
      <path d="M6 6l6 6M12 6l-6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function GuestGrowthPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    num_properties: '',
    listing_url: '',
    package: '',
    message: '',
  })
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormState('loading')
    try {
      const res = await fetch('/api/public/guestgrowth-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Server error')
      setFormState('success')
    } catch {
      setFormState('error')
    }
  }

  function selectPackage(id: string) {
    setFormData((f) => ({ ...f, package: id }))
    document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#111111', backgroundColor: '#ffffff' }}>

      {/* ── Sticky nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#1A3A4A',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
      }}>
        <span style={{ color: '#C9A84C', fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.05em' }}>
          GuestGrowth
        </span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a
            href="/guestgrowth/sample"
            style={{ color: '#ffffff', fontSize: '13px', textDecoration: 'none', opacity: 0.8 }}
          >
            See Sample
          </a>
          <a
            href="#get-started"
            style={{
              backgroundColor: '#C9A84C', color: '#1A3A4A', padding: '8px 18px',
              borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none',
            }}
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0d2233 0%, #1A3A4A 60%, #1e4d6b 100%)',
        padding: '80px 24px 72px', textAlign: 'center',
      }}>
        <p style={{
          fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase',
          color: '#C9A84C', marginBottom: '20px',
        }}>
          For Airbnb & VRBO Hosts
        </p>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 58px)', fontWeight: '800', color: '#ffffff',
          lineHeight: 1.1, margin: '0 auto 24px', maxWidth: '760px',
        }}>
          Turn Every WiFi Password<br />Into a Guest Email
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'rgba(255,255,255,0.75)',
          maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.6,
        }}>
          One QR code at your property. Guests scan to get the WiFi — you get their email.
          Re-book direct, skip Airbnb fees, build a business you own.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="#get-started"
            style={{
              backgroundColor: '#C9A84C', color: '#1A3A4A', padding: '16px 36px',
              borderRadius: '4px', fontSize: '16px', fontWeight: 'bold',
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            Get My QR System →
          </a>
          <a
            href="/guestgrowth/sample"
            style={{
              backgroundColor: 'transparent', color: '#ffffff', padding: '16px 36px',
              borderRadius: '4px', fontSize: '16px', fontWeight: 'bold',
              textDecoration: 'none', border: '2px solid rgba(255,255,255,0.4)',
              display: 'inline-block',
            }}
          >
            See Sample Guide
          </a>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section style={{
        backgroundColor: '#f8f4ee', borderTop: '1px solid #e8dfc8',
        borderBottom: '1px solid #e8dfc8', padding: '20px 24px',
      }}>
        <div style={{
          maxWidth: '800px', margin: '0 auto', display: 'flex',
          justifyContent: 'center', gap: '40px', flexWrap: 'wrap', textAlign: 'center',
        }}>
          {['One-time fee, no monthly costs', 'Setup in 3–5 business days', 'Works on any phone'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckIcon color="#C9A84C" />
              <span style={{ fontSize: '13px', color: '#5a4a2a', fontWeight: '600' }}>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pain section ── */}
      <section style={{ padding: '80px 24px', maxWidth: '960px', margin: '0 auto' }}>
        <p style={{
          textAlign: 'center', fontSize: '12px', letterSpacing: '0.25em',
          textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px',
        }}>
          The Problem
        </p>
        <h2 style={{
          textAlign: 'center', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '800',
          color: '#1A3A4A', marginBottom: '48px', lineHeight: 1.2,
        }}>
          Airbnb owns your guests.<br />You do all the work.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {PAIN_CARDS.map((c) => (
            <div key={c.stat} style={{
              border: '1px solid #e5e5e5', borderRadius: '10px', padding: '32px 24px',
              borderTop: '3px solid #C9A84C',
            }}>
              <div style={{ fontSize: '44px', fontWeight: '800', color: '#1A3A4A', lineHeight: 1 }}>
                {c.stat}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#333', margin: '10px 0 8px' }}>
                {c.label}
              </div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6 }}>{c.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ backgroundColor: '#f9f9f9', padding: '80px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{
            textAlign: 'center', fontSize: '12px', letterSpacing: '0.25em',
            textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px',
          }}>
            How It Works
          </p>
          <h2 style={{
            textAlign: 'center', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800',
            color: '#1A3A4A', marginBottom: '48px',
          }}>
            Three steps. Done once.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
            {[
              { step: '01', title: 'Print your QR card', body: 'We send you a print-ready card. Leave it on the kitchen counter, coffee table, or welcome book.' },
              { step: '02', title: 'Guest scans → enters email', body: 'They get your mobile-optimized guide with WiFi, house rules, and local tips. You get their email.' },
              { step: '03', title: 'Automated re-booking emails', body: 'After checkout, your email automation sends a 10%-off direct booking offer — Airbnb fee avoided.' },
            ].map((s) => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  backgroundColor: '#1A3A4A', color: '#C9A84C',
                  fontSize: '16px', fontWeight: '800', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A3A4A', marginBottom: '8px' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.6, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample preview ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1A3A4A 0%, #0d2233 100%)',
        padding: '80px 24px', textAlign: 'center',
      }}>
        <p style={{
          fontSize: '12px', letterSpacing: '0.25em', textTransform: 'uppercase',
          color: '#C9A84C', marginBottom: '12px',
        }}>
          See It Live
        </p>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800', color: '#ffffff', marginBottom: '16px',
        }}>
          This is what your guests see
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', marginBottom: '36px' }}>
          Mobile-first, branded to your property, delivered in seconds.
        </p>
        <a
          href="/guestgrowth/sample"
          style={{
            backgroundColor: '#C9A84C', color: '#1A3A4A', padding: '16px 40px',
            borderRadius: '4px', fontSize: '16px', fontWeight: 'bold',
            textDecoration: 'none', display: 'inline-block',
          }}
        >
          Open Sample Guest Guide →
        </a>
      </section>

      {/* ── Comparison table ── */}
      <section style={{ padding: '80px 24px', maxWidth: '840px', margin: '0 auto' }}>
        <p style={{
          textAlign: 'center', fontSize: '12px', letterSpacing: '0.25em',
          textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px',
        }}>
          Why GuestGrowth
        </p>
        <h2 style={{
          textAlign: 'center', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800',
          color: '#1A3A4A', marginBottom: '40px',
        }}>
          Everything else leaves money on the table
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #1A3A4A' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#666' }}>Feature</th>
                {['GuestGrowth', 'Printed Guidebook', 'WiFi Only'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'center', padding: '12px 16px', fontSize: '13px',
                    color: h === 'GuestGrowth' ? '#1A3A4A' : '#999',
                    fontWeight: h === 'GuestGrowth' ? '800' : '600',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_DATA.map((row, i) => (
                <tr key={row.feature} style={{ backgroundColor: i % 2 === 0 ? '#fafafa' : '#ffffff', borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>{row.feature}</td>
                  <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                    {row.us ? <CheckIcon /> : <XIcon />}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                    {row.guidebook ? <CheckIcon color="#6b7280" /> : <XIcon />}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                    {row.wifiOnly ? <CheckIcon color="#6b7280" /> : <XIcon />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ backgroundColor: '#f9f9f9', padding: '80px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p style={{
            textAlign: 'center', fontSize: '12px', letterSpacing: '0.25em',
            textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px',
          }}>
            Pricing
          </p>
          <h2 style={{
            textAlign: 'center', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800',
            color: '#1A3A4A', marginBottom: '12px',
          }}>
            One-time fee. No subscriptions.
          </h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '48px', fontSize: '15px' }}>
            Pay once, use forever. Most hosts recoup the cost in a single direct booking.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {PRICING_TIERS.map((tier) => (
              <div key={tier.id} style={{
                backgroundColor: '#ffffff', borderRadius: '12px', padding: '36px 28px',
                border: tier.highlighted ? '2px solid #C9A84C' : '1px solid #e5e5e5',
                position: 'relative',
                boxShadow: tier.highlighted ? '0 8px 32px rgba(201,168,76,0.15)' : 'none',
              }}>
                {tier.highlighted && (
                  <div style={{
                    position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#C9A84C', color: '#1A3A4A', fontSize: '11px',
                    fontWeight: '800', letterSpacing: '0.1em', padding: '4px 16px', borderRadius: '20px',
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <p style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>
                  {tier.description}
                </p>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A3A4A', marginBottom: '4px' }}>
                  {tier.name}
                </h3>
                <div style={{ fontSize: '42px', fontWeight: '800', color: '#1A3A4A', lineHeight: 1, margin: '16px 0 24px' }}>
                  {tier.price}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                      <CheckIcon color="#C9A84C" />
                      <span style={{ fontSize: '14px', color: '#444', lineHeight: 1.4 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => selectPackage(tier.id)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '4px',
                    backgroundColor: tier.highlighted ? '#C9A84C' : '#1A3A4A',
                    color: tier.highlighted ? '#1A3A4A' : '#ffffff',
                    fontSize: '14px', fontWeight: '800', border: 'none', cursor: 'pointer',
                  }}
                >
                  {tier.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead form ── */}
      <section id="get-started" style={{ padding: '80px 24px', maxWidth: '600px', margin: '0 auto' }}>
        <p style={{
          textAlign: 'center', fontSize: '12px', letterSpacing: '0.25em',
          textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px',
        }}>
          Get Started
        </p>
        <h2 style={{
          textAlign: 'center', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '800',
          color: '#1A3A4A', marginBottom: '12px',
        }}>
          Tell us about your property
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px', fontSize: '15px' }}>
          We'll follow up within 24 hours to get you set up.
        </p>

        {formState === 'success' ? (
          <div style={{
            backgroundColor: '#f0fdf4', border: '1px solid #22c55e', borderRadius: '10px',
            padding: '40px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#1A3A4A', fontSize: '20px', marginBottom: '8px' }}>Got it — we'll be in touch!</h3>
            <p style={{ color: '#555', fontSize: '15px', margin: 0 }}>
              Expect an email from us within 24 hours. Check your spam folder just in case.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Your name *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email address *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jane@example.com"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Number of properties</label>
                <input
                  value={formData.num_properties}
                  onChange={(e) => setFormData((f) => ({ ...f, num_properties: e.target.value }))}
                  placeholder="1"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Package</label>
                <select
                  value={formData.package}
                  onChange={(e) => setFormData((f) => ({ ...f, package: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Select a package</option>
                  {PRICING_TIERS.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {t.price}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Airbnb / VRBO listing URL (optional)</label>
              <input
                value={formData.listing_url}
                onChange={(e) => setFormData((f) => ({ ...f, listing_url: e.target.value }))}
                placeholder="airbnb.com/rooms/..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Anything else we should know?</label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))}
                placeholder="Multiple properties, specific questions, timeline, etc."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            {formState === 'error' && (
              <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>
                Something went wrong. Please try again or email us directly.
              </p>
            )}
            <button
              type="submit"
              disabled={formState === 'loading'}
              style={{
                backgroundColor: '#C9A84C', color: '#1A3A4A', padding: '16px',
                borderRadius: '4px', fontSize: '16px', fontWeight: '800',
                border: 'none', cursor: formState === 'loading' ? 'not-allowed' : 'pointer',
                opacity: formState === 'loading' ? 0.7 : 1,
              }}
            >
              {formState === 'loading' ? 'Sending…' : 'Send My Request →'}
            </button>
          </form>
        )}
      </section>

      {/* ── FAQ ── */}
      <section style={{ backgroundColor: '#f9f9f9', padding: '80px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '800',
            color: '#1A3A4A', marginBottom: '40px',
          }}>
            Frequently asked questions
          </h2>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid #e5e5e5', marginBottom: '2px' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', gap: '16px',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1A3A4A' }}>{item.q}</span>
                <span style={{
                  color: '#C9A84C', fontSize: '20px', flexShrink: 0,
                  transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
                }}>
                  +
                </span>
              </button>
              {openFaq === i && (
                <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.7, padding: '0 0 18px', margin: 0 }}>
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1A3A4A 0%, #0d2233 100%)',
        padding: '80px 24px', textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: '800', color: '#ffffff',
          marginBottom: '16px', lineHeight: 1.2,
        }}>
          Stop giving Airbnb<br />a 20% cut forever.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', marginBottom: '36px', maxWidth: '440px', margin: '0 auto 36px' }}>
          One QR code. One email list. One direct booking pays for the whole system.
        </p>
        <a
          href="#get-started"
          style={{
            backgroundColor: '#C9A84C', color: '#1A3A4A', padding: '18px 48px',
            borderRadius: '4px', fontSize: '17px', fontWeight: '800',
            textDecoration: 'none', display: 'inline-block',
          }}
        >
          Get My QR System →
        </a>
      </section>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: '#0d2233', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>
          GuestGrowth is a service by{' '}
          <a href="/" style={{ color: '#C9A84C', textDecoration: 'none' }}>Sea & City Rentals</a>
          {' '}· Tampa Bay, FL
        </p>
      </footer>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '700', color: '#444',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: '4px',
  fontSize: '14px', color: '#111', backgroundColor: '#ffffff', boxSizing: 'border-box',
  outline: 'none',
}
