import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/guestgrowth/')({
  head: () => ({
    meta: [
      { title: 'GuestGrowth QR System — Done-For-You Guest Email Automation' },
      {
        name: 'description',
        content:
          'We build your QR guest guide, set up email capture, and automate your follow-ups. You print a card. Your guest list grows on autopilot. One-time fee, no monthly costs.',
      },
    ],
  }),
  component: GuestGrowthPage,
})

const PRICING_TIERS = [
  {
    id: 'starter',
    name: 'WiFi QR + Email Capture',
    price: '$299',
    description: 'One-time setup',
    features: [
      'Custom QR code for your property',
      'Mobile-optimized guest guide page',
      'WiFi credentials reveal',
      'Email gate before WiFi reveal',
      'Guest emails automatically collected',
      'House rules & check-in steps',
      'Local recommendations (we research & write)',
      'Book Direct CTA built in',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    id: 'automation',
    name: 'WiFi QR + Email + Automation',
    price: '$399',
    description: 'One-time setup — most popular',
    features: [
      'Everything in WiFi QR + Email Capture',
      'Full MailerLite automation setup',
      'Welcome email to every new guest',
      'Re-booking campaign (10% off direct)',
      'Review request sequence',
      'All follow-up emails written for you',
    ],
    cta: 'Get Full Automation',
    highlighted: true,
  },
  {
    id: 'full-site',
    name: 'Direct Booking Website',
    price: '$999',
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
  { feature: 'Mobile guest guide (house rules, check-in, local tips)', us: true, stayfi: false, touchstay: true },
  { feature: 'WiFi password delivery via QR code', us: true, stayfi: true, touchstay: false },
  { feature: 'Captures guest email automatically', us: true, stayfi: true, touchstay: false },
  { feature: 'Re-booking / direct booking campaign', us: true, stayfi: true, touchstay: false },
  { feature: 'No hardware required', us: true, stayfi: false, touchstay: true },
  { feature: 'No monthly subscription fee', us: true, stayfi: false, touchstay: false },
  { feature: 'One-time setup, own it forever', us: true, stayfi: false, touchstay: false },
  { feature: 'Works across unlimited stays', us: true, stayfi: true, touchstay: true },
]

const PAIN_CARDS = [
  {
    stat: '0 hrs',
    label: 'Your time to set up',
    detail:
      'You send us 4 things. We research your neighborhood, write the guide content, build the page, and configure everything. You get a print-ready QR card back in 3–5 days.',
  },
  {
    stat: '$300/yr',
    label: 'What StayFi + a guidebook costs',
    detail:
      "Most hosts end up paying for two tools that still don't fully replace each other — hardware upfront, then monthly fees every year, forever.",
  },
  {
    stat: '1 booking',
    label: 'All it takes to pay for itself',
    detail:
      'One direct re-booking (avg. $700–$1,200 for a Florida property, no Airbnb cut) covers your entire GuestGrowth investment. Everything after that is pure profit.',
  },
]

const WHAT_WE_BUILD = [
  { label: 'Mobile guest guide page', detail: 'Written, designed, and hosted — guests open it instantly in their browser, no app needed.' },
  { label: 'WiFi email gate', detail: 'Guests enter their email to unlock the password. Configured and tested before delivery.' },
  { label: 'Local recommendations', detail: 'We research restaurants, beaches, and activities for your specific property location.' },
  { label: 'Print-ready QR card', detail: 'Formatted and sized — take it to any print shop or print at home. Done.' },
  { label: 'MailerLite account setup', detail: 'Your email list, automation triggers, and sequences fully configured. (Automation tier)', automationOnly: true },
  { label: 'Welcome email sequence', detail: 'Written and automated — every new guest gets a personal-feeling welcome and check-in tips. (Automation tier)', automationOnly: true },
  { label: 'Re-booking campaign', detail: '10% off direct booking offer, timed and automated. We write the copy. (Automation tier)', automationOnly: true },
]

const FAQ_ITEMS = [
  {
    q: 'Do I have to do any of the setup myself?',
    a: "No. You send us four things: your property address, WiFi name & password, house rules, and an emergency contact. We research your neighborhood, write the local recommendations, build the guide page, set up the email capture, and configure all the automations. You get a print-ready QR card back in 3–5 business days. Your only job is to print it and place it at the property.",
  },
  {
    q: 'What is the 30-day money-back guarantee?',
    a: "If we deliver your completed guide and setup and you're not satisfied, we'll refund you in full within 30 days — no questions asked. We're confident in the results because we built this for our own 16 Tampa Bay properties before offering it to anyone else.",
  },
  {
    q: 'How is this different from StayFi?',
    a: "StayFi requires you to buy their hardware ($89–$205 per access point) and pay a monthly fee on top. It captures emails but doesn't give guests a guide. GuestGrowth needs no hardware — guests scan a printed QR code — and includes the full guest guide built in.",
  },
  {
    q: 'How is this different from Touch Stay or GoGuidebook?',
    a: "Those are guidebook-only tools. They show house rules and local tips, but they don't capture guest emails and don't require any opt-in. GuestGrowth ties the WiFi reveal to an email opt-in, so every guest who wants the password becomes a contact you own.",
  },
  {
    q: 'What if a guest refuses to enter their email?',
    a: "Guests enter their email to get the WiFi password — that's the exchange, same as hotels, coffee shops, and airports. In practice, nearly all guests complete it without hesitation because they want the password and the guide.",
  },
  {
    q: 'How long does setup take?',
    a: "Just send us your WiFi details, house rules, emergency contact, and property address. We research your local area and write the recommendations for you. Your guide and QR card are ready in 3–5 business days — you just print and place it.",
  },
  {
    q: 'Do I need any technical knowledge or hardware?',
    a: "None. No router changes, no hardware, no app install. You print a card, place it at the property, and we handle everything else.",
  },
  {
    q: 'What happens to the email list — do I own it?',
    a: "Yes, 100% yours. Guest emails are added to your own MailerLite account, which you control. We don't hold your list, we don't market to your guests, and there's no lock-in. If you ever stop using GuestGrowth, your list stays with you.",
  },
  {
    q: "I'm already on Airbnb and VRBO — does this still work?",
    a: "Yes. The QR card sits at your property and works regardless of where guests booked. Airbnb, VRBO, direct — every guest who scans it gets the guide and goes into your email list. The platform doesn't matter.",
  },
  {
    q: 'Is the guide mobile-friendly?',
    a: "It's designed specifically for phones. Guests scan the QR code and it opens instantly in their browser — no app to download, no login, no friction. Works on every iPhone and Android.",
  },
  {
    q: "What if I don't have a website?",
    a: "No website needed. The email automation works without one — your follow-up can say \"Reply to this email to book your next stay\" or \"Text me at (your number) for a direct booking discount.\" Many hosts with one or two properties prefer it that way. If you want a full site later, we build those too.",
  },
  {
    q: 'Can I use this for multiple properties?',
    a: 'Yes — each property gets its own QR code and guide page. Contact us for multi-property pricing.',
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
          Done-For-You · For Airbnb & VRBO Hosts
        </p>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 58px)', fontWeight: '800', color: '#ffffff',
          lineHeight: 1.1, margin: '0 auto 24px', maxWidth: '800px',
        }}>
          Your Guest Email List,<br />On Autopilot
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'rgba(255,255,255,0.75)',
          maxWidth: '600px', margin: '0 auto 16px', lineHeight: 1.6,
        }}>
          We build your QR guest guide, set up the email capture, and automate your follow-ups.
          You print a card and place it at your property. That's your only job.
        </p>
        <p style={{
          fontSize: '14px', color: 'rgba(255,255,255,0.5)',
          margin: '0 auto 40px',
        }}>
          Replaces StayFi + your guidebook app. One-time fee. No hardware. No monthly costs.
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
            Get My Setup →
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
          maxWidth: '900px', margin: '0 auto', display: 'flex',
          justifyContent: 'center', gap: '40px', flexWrap: 'wrap', textAlign: 'center',
        }}>
          {[
            'We handle the entire setup',
            'Ready in 3–5 business days',
            '30-day money-back guarantee',
          ].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckIcon color="#C9A84C" />
              <span style={{ fontSize: '13px', color: '#5a4a2a', fontWeight: '600' }}>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pain / value section ── */}
      <section style={{ padding: '80px 24px', maxWidth: '960px', margin: '0 auto' }}>
        <p style={{
          textAlign: 'center', fontSize: '12px', letterSpacing: '0.25em',
          textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px',
        }}>
          The Value
        </p>
        <h2 style={{
          textAlign: 'center', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '800',
          color: '#1A3A4A', marginBottom: '48px', lineHeight: 1.2,
        }}>
          Zero setup time. Pays for itself<br />with one direct booking.
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
            color: '#1A3A4A', marginBottom: '8px',
          }}>
            You do 5 minutes of work. We do the rest.
          </h2>
          <p style={{
            textAlign: 'center', color: '#666', fontSize: '15px', marginBottom: '48px',
          }}>
            This is a done-for-you service — not a DIY tool you have to figure out.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
            {[
              { step: '01', title: 'You send us 4 things', body: 'Property address, WiFi name & password, house rules, and an emergency contact. That\'s it — 5 minutes of your time, one email.' },
              { step: '02', title: 'We build everything', body: 'Your guide page, QR code, email capture gate, local recommendations (written for you), and all automation sequences. We handle it all.' },
              { step: '03', title: 'You print & place the card', body: 'We send a print-ready QR card. Leave it on the counter. Every guest who scans goes into your email list automatically — forever.' },
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

      {/* ── What we build for you ── */}
      <section style={{ padding: '80px 24px', maxWidth: '860px', margin: '0 auto' }}>
        <p style={{
          textAlign: 'center', fontSize: '12px', letterSpacing: '0.25em',
          textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px',
        }}>
          What's Included
        </p>
        <h2 style={{
          textAlign: 'center', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: '800',
          color: '#1A3A4A', marginBottom: '12px', lineHeight: 1.2,
        }}>
          Everything is built and delivered to you.
        </h2>
        <p style={{
          textAlign: 'center', color: '#666', fontSize: '15px', marginBottom: '48px', maxWidth: '560px', margin: '0 auto 48px',
        }}>
          This isn't software you configure yourself. We do the research, the writing, the technical setup, and the automation — and hand you a finished product.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {WHAT_WE_BUILD.map((item) => (
            <div key={item.label} style={{
              display: 'flex', gap: '14px', alignItems: 'flex-start',
              padding: '20px 24px', borderRadius: '8px',
              backgroundColor: item.automationOnly ? '#f8f4ee' : '#f9f9f9',
              border: item.automationOnly ? '1px solid #e8dfc8' : '1px solid #efefef',
            }}>
              <CheckIcon color={item.automationOnly ? '#C9A84C' : '#1A3A4A'} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A3A4A', marginBottom: '4px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── No website needed ── */}
      <section style={{ backgroundColor: '#f9f9f9', padding: '80px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{
            textAlign: 'center', fontSize: '12px', letterSpacing: '0.25em',
            textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px',
          }}>
            Flexible by Design
          </p>
          <h2 style={{
            textAlign: 'center', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: '800',
            color: '#1A3A4A', marginBottom: '16px', lineHeight: 1.2,
          }}>
            Have a website? Great. Don't have one? Also great.
          </h2>
          <p style={{
            textAlign: 'center', color: '#555', fontSize: '16px', lineHeight: 1.7,
            maxWidth: '640px', margin: '0 auto 48px',
          }}>
            If you have a direct booking site, your email follow-ups send guests straight there.
            If you don't, no problem — the emails can direct guests to reply, text you, or book however works best for you.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {[
              {
                icon: '✉️',
                title: 'Reply-to-book',
                body: 'Your follow-up email can simply say "Reply to this email and I\'ll send you a direct booking discount." No website, no checkout — just a real conversation.',
              },
              {
                icon: '📱',
                title: 'Text for direct bookings',
                body: 'We can set your emails to say "Text me at (your number) to book your next stay and skip the Airbnb fee." Great for hosts who prefer talking directly.',
              },
              {
                icon: '🔗',
                title: 'Add a website later',
                body: 'If you grow to 5+ properties and want a full direct booking site, we build those too. Start simple now — upgrade when it makes sense.',
              },
            ].map((card) => (
              <div key={card.title} style={{
                backgroundColor: '#ffffff', borderRadius: '10px', padding: '28px 24px',
                borderTop: '3px solid #1A3A4A',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{card.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A3A4A', marginBottom: '8px' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.6, margin: 0 }}>{card.body}</p>
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

      {/* ── Testimonial ── */}
      <section style={{ padding: '80px 24px', maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{
          fontSize: '12px', letterSpacing: '0.25em', textTransform: 'uppercase',
          color: '#C9A84C', marginBottom: '32px',
        }}>
          Built on Our Own Properties First
        </p>
        <blockquote style={{
          fontSize: 'clamp(17px, 2.5vw, 22px)', fontStyle: 'italic', color: '#1A3A4A',
          lineHeight: 1.65, margin: '0 0 28px', fontWeight: '400',
        }}>
          "We run 16 vacation rentals across Tampa Bay. We built GuestGrowth for ourselves before offering it to anyone else. First season: 180+ guest emails collected, 11 direct re-bookings, over $4,000 saved in Airbnb fees. That's when we knew other hosts needed this."
        </blockquote>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            backgroundColor: '#1A3A4A', color: '#C9A84C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: '800',
          }}>
            M
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A3A4A' }}>Marko P.</div>
            <div style={{ fontSize: '13px', color: '#888' }}>Sea & City Rentals · Tampa Bay, FL · 16 properties</div>
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section style={{ backgroundColor: '#f9f9f9', padding: '80px 24px' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <p style={{
            textAlign: 'center', fontSize: '12px', letterSpacing: '0.25em',
            textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px',
          }}>
            Why GuestGrowth
          </p>
          <h2 style={{
            textAlign: 'center', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800',
            color: '#1A3A4A', marginBottom: '12px',
          }}>
            StayFi does WiFi. Touch Stay does guidebooks.<br />Neither does both.
          </h2>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '15px', marginBottom: '40px' }}>
            Most hosts end up paying for two tools. GuestGrowth is one — and we set it all up for you.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #1A3A4A' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#666' }}>Feature</th>
                  {[
                    { label: 'GuestGrowth', sub: 'from $299 one-time' },
                    { label: 'StayFi', sub: '$100 hardware + $15/mo' },
                    { label: 'Touch Stay', sub: '$15/mo guidebook only' },
                  ].map((h) => (
                    <th key={h.label} style={{
                      textAlign: 'center', padding: '12px 8px', fontSize: '13px',
                      color: h.label === 'GuestGrowth' ? '#1A3A4A' : '#999',
                      fontWeight: h.label === 'GuestGrowth' ? '800' : '600',
                    }}>
                      <div>{h.label}</div>
                      <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '2px', color: h.label === 'GuestGrowth' ? '#C9A84C' : '#bbb' }}>{h.sub}</div>
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
                      {row.stayfi ? <CheckIcon color="#6b7280" /> : <XIcon />}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                      {row.touchstay ? <CheckIcon color="#6b7280" /> : <XIcon />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: '80px 24px' }}>
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
            One-time fee. We do all the work.
          </h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '16px', fontSize: '15px' }}>
            Pay once, own it forever. Most hosts recoup the cost with a single direct booking.
          </p>

          {/* Scarcity banner */}
          <div style={{
            backgroundColor: '#fff8e6', border: '1px solid #e8dfc8', borderRadius: '8px',
            padding: '14px 24px', marginBottom: '32px', textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '16px' }}>⏳</span>
            <p style={{ margin: 0, fontSize: '14px', color: '#7a5c1a', fontWeight: '600' }}>
              We personally handle every setup — currently accepting{' '}
              <strong style={{ color: '#1A3A4A' }}>5 new setups this month.</strong>{' '}
              A few spots remaining.
            </p>
          </div>

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
                <div style={{ fontSize: '42px', fontWeight: '800', color: '#1A3A4A', lineHeight: 1, margin: '16px 0 24px', whiteSpace: 'nowrap' }}>
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

          {/* Guarantee note */}
          <div style={{
            marginTop: '32px', textAlign: 'center', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '22px' }}>🛡️</span>
            <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
              <strong style={{ color: '#1A3A4A' }}>30-day money-back guarantee.</strong>{' '}
              If you're not satisfied after we deliver your setup, we'll refund you in full — no questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* ── What you receive (notification mockup) ── */}
      <section style={{ backgroundColor: '#f9f9f9', padding: '80px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <p style={{
            textAlign: 'center', fontSize: '12px', letterSpacing: '0.25em',
            textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px',
          }}>
            What You Get
          </p>
          <h2 style={{
            textAlign: 'center', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: '800',
            color: '#1A3A4A', marginBottom: '16px',
          }}>
            The moment someone's interested, you know.
          </h2>
          <p style={{
            textAlign: 'center', color: '#666', fontSize: '15px', marginBottom: '40px',
          }}>
            Every lead submission sends you an instant notification like this:
          </p>

          {/* Email mockup */}
          <div style={{
            backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px',
            overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            {/* Email header bar */}
            <div style={{
              backgroundColor: '#1A3A4A', padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginLeft: '8px' }}>Email notification</span>
            </div>
            {/* Email meta */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>
                <strong style={{ color: '#555' }}>From:</strong> GuestGrowth Alerts &lt;vacation@seaandcityrentals.com&gt;
              </div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
                <strong style={{ color: '#555' }}>Subject:</strong> New GuestGrowth lead just came in
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1A3A4A' }}>
                New GuestGrowth lead just came in:
              </div>
            </div>
            {/* Email body */}
            <div style={{ padding: '20px 24px' }}>
              {[
                { label: 'From', value: 'Sarah Martinez <sarah@gmail.com>' },
                { label: 'Package', value: 'WiFi QR + Email + Automation — $399' },
                { label: 'Properties', value: '2' },
                { label: 'Listing', value: 'airbnb.com/rooms/12345678' },
                { label: 'Message', value: 'Looking to set up before summer season. Both properties are in Clearwater.' },
              ].map((row) => (
                <div key={row.label} style={{
                  display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '14px',
                }}>
                  <span style={{ color: '#888', minWidth: '72px', fontWeight: '600' }}>{row.label}:</span>
                  <span style={{ color: '#1A3A4A' }}>{row.value}</span>
                </div>
              ))}
            </div>
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
            {/* Guarantee badge */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', paddingTop: '4px',
            }}>
              <span style={{ fontSize: '16px' }}>🛡️</span>
              <span style={{ fontSize: '12px', color: '#888' }}>
                30-day money-back guarantee — if you're not satisfied, we'll refund you in full.
              </span>
            </div>
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
          Your guest list won't grow itself.<br />Let us automate it for you.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', maxWidth: '480px', margin: '0 auto 16px' }}>
          Done-for-you setup in 3–5 days. One-time fee. Pays for itself with one direct booking.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '36px' }}>
          🛡️ 30-day money-back guarantee
        </p>
        <a
          href="#get-started"
          style={{
            backgroundColor: '#C9A84C', color: '#1A3A4A', padding: '18px 48px',
            borderRadius: '4px', fontSize: '17px', fontWeight: '800',
            textDecoration: 'none', display: 'inline-block',
          }}
        >
          Get My Setup →
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
