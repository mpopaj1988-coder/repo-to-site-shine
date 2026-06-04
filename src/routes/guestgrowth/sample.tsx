import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/guestgrowth/sample')({
  head: () => ({
    meta: [
      { title: 'Sample Guest Guide — GuestGrowth QR System' },
      { name: 'description', content: 'See exactly what your guests experience after scanning your QR code.' },
    ],
  }),
  component: SampleGuidePage,
})

const SAMPLE_PROPERTY = {
  name: 'Beachfront Bungalow at Indian Rocks',
  wifiNetwork: 'BeachBungalow_5G',
  wifiPassword: 'SunsetVibes2024!',
  checkIn: '4:00 PM',
  checkOut: '10:00 AM',
  emergencyContact: '(727) 555-0192',
  bookDirectUrl: 'https://seaandcityrentals.com',
  houseRules: [
    'No smoking inside — porch only',
    'No pets unless pre-approved',
    'Max 6 guests — no unregistered visitors',
    'Keep music/noise down after 10 PM',
    'No parties or events',
    'Treat the place like your own home',
  ],
  checkInInstructions: [
    'Park in the driveway (2 spaces) — do not block the neighbors',
    'Lockbox is on the front door handle — code: 4829',
    'Main breaker panel is in the hallway closet if anything trips',
    'AC thermostat is in the living room — keep it above 72°F to avoid freezing',
    'Trash bins are on the side of the house — garbage pickup is Monday',
  ],
  localRecommendations: [
    {
      category: '🍽 Restaurants',
      items: [
        { name: 'The Original Crabby Bills', note: '5 min walk · best grouper sandwich on the beach' },
        { name: 'Slyce Indian Rocks Beach', note: '3 min drive · wood-fired pizza, great patio' },
        { name: 'Salt Rock Grill', note: '7 min drive · upscale waterfront, sunsets are unreal' },
      ],
    },
    {
      category: '🏖 Beach & Outdoors',
      items: [
        { name: 'Indian Rocks Beach Access', note: '2 min walk · chairs & umbrella in the garage, help yourself' },
        { name: 'Walsingham Park', note: '15 min drive · kayak launch, walking trails' },
        { name: 'Clearwater Marine Aquarium', note: '20 min drive · Winter the dolphin, great for kids' },
      ],
    },
    {
      category: '☕ Coffee & Casual',
      items: [
        { name: 'Sandy Toes Café', note: '4 min walk · best breakfast burritos' },
        { name: 'Starbucks Largo', note: '10 min drive · quickest option if you need a fix' },
      ],
    },
  ],
}

function SampleGuidePage() {
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [wifiRevealed, setWifiRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>('check-in')

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setEmailSubmitted(true)
    setWifiRevealed(true)
  }

  function handleSkip() {
    setEmailSubmitted(true)
    setWifiRevealed(true)
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(SAMPLE_PROPERTY.wifiPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: no-op
    }
  }

  function toggleSection(id: string) {
    setOpenSection(openSection === id ? null : id)
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>

      {/* Demo banner */}
      <div style={{
        backgroundColor: '#C9A84C', color: '#1A3A4A', textAlign: 'center',
        padding: '10px 16px', fontSize: '13px', fontWeight: '700',
      }}>
        SAMPLE GUIDE — This is what your guests see after scanning your QR code.{' '}
        <a href="/guestgrowth" style={{ color: '#1A3A4A', textDecoration: 'underline' }}>
          Get yours →
        </a>
      </div>

      {/* Property header */}
      <div style={{ backgroundColor: '#1A3A4A', padding: '32px 20px 24px', textAlign: 'center' }}>
        <p style={{
          fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase',
          color: '#C9A84C', marginBottom: '8px',
        }}>
          Welcome to
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px', lineHeight: 1.2 }}>
          {SAMPLE_PROPERTY.name}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Check-in</div>
            <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '700' }}>{SAMPLE_PROPERTY.checkIn}</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Check-out</div>
            <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '700' }}>{SAMPLE_PROPERTY.checkOut}</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Emergency</div>
            <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '700' }}>{SAMPLE_PROPERTY.emergencyContact}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px 80px' }}>

        {/* WiFi section */}
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px', marginTop: '20px',
          overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '22px' }}>📶</span>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#1A3A4A', margin: 0 }}>WiFi Access</h2>
            </div>
          </div>

          {!emailSubmitted ? (
            <div style={{ padding: '0 20px 20px' }}>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px', lineHeight: 1.5 }}>
                Enter your email to reveal the password — we'll send you a 10% off code for your next direct stay.
              </p>
              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: '100%', padding: '12px 14px', border: '1px solid #ddd',
                    borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box',
                  }}
                />
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '12px', color: '#888', lineHeight: 1.5 }}>
                    I agree to receive occasional emails from this property (re-booking offers, local tips). Unsubscribe anytime.
                  </span>
                </label>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#1A3A4A', color: '#ffffff', padding: '13px',
                    borderRadius: '6px', fontSize: '15px', fontWeight: '700',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  Reveal WiFi Password →
                </button>
              </form>
              <button
                onClick={handleSkip}
                style={{
                  background: 'none', border: 'none', color: '#aaa', fontSize: '13px',
                  cursor: 'pointer', marginTop: '12px', display: 'block', width: '100%', textAlign: 'center',
                }}
              >
                Skip — just show me the password
              </button>
            </div>
          ) : (
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{
                backgroundColor: '#f0f9f4', border: '1px solid #86efac', borderRadius: '8px',
                padding: '16px', marginBottom: '12px',
              }}>
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Network
                </div>
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#1A3A4A', marginBottom: '12px' }}>
                  {SAMPLE_PROPERTY.wifiNetwork}
                </div>
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Password
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#1A3A4A', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {SAMPLE_PROPERTY.wifiPassword}
                  </span>
                  <button
                    onClick={copyPassword}
                    style={{
                      backgroundColor: copied ? '#22c55e' : '#1A3A4A', color: '#ffffff',
                      border: 'none', borderRadius: '6px', padding: '8px 14px',
                      fontSize: '13px', fontWeight: '700', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion sections */}
        {[
          {
            id: 'check-in',
            icon: '🗝',
            title: 'Check-in & Check-out',
            content: (
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                {SAMPLE_PROPERTY.checkInInstructions.map((step, i) => (
                  <li key={i} style={{ fontSize: '14px', color: '#444', lineHeight: 1.7, marginBottom: '4px' }}>
                    {step}
                  </li>
                ))}
              </ul>
            ),
          },
          {
            id: 'rules',
            icon: '📋',
            title: 'House Rules',
            content: (
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                {SAMPLE_PROPERTY.houseRules.map((rule, i) => (
                  <li key={i} style={{ fontSize: '14px', color: '#444', lineHeight: 1.7, marginBottom: '4px' }}>
                    {rule}
                  </li>
                ))}
              </ul>
            ),
          },
          {
            id: 'local',
            icon: '📍',
            title: 'Local Recommendations',
            content: (
              <div>
                {SAMPLE_PROPERTY.localRecommendations.map((group) => (
                  <div key={group.category} style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A3A4A', marginBottom: '10px' }}>
                      {group.category}
                    </div>
                    {group.items.map((item) => (
                      <div key={item.name} style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#333' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{item.note}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ),
          },
        ].map((section) => (
          <div key={section.id} style={{
            backgroundColor: '#ffffff', borderRadius: '12px', marginTop: '12px',
            overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <button
              onClick={() => toggleSection(section.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{section.icon}</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#1A3A4A' }}>{section.title}</span>
              </div>
              <span style={{
                color: '#C9A84C', fontSize: '22px', lineHeight: 1,
                transform: openSection === section.id ? 'rotate(45deg)' : 'none',
                transition: 'transform 0.2s',
              }}>
                +
              </span>
            </button>
            {openSection === section.id && (
              <div style={{ padding: '0 20px 20px' }}>{section.content}</div>
            )}
          </div>
        ))}

        {/* Book Direct CTA */}
        <div style={{
          backgroundColor: '#1A3A4A', borderRadius: '12px', marginTop: '20px',
          padding: '28px 20px', textAlign: 'center',
        }}>
          <p style={{
            fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#C9A84C', marginBottom: '8px',
          }}>
            Coming back?
          </p>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginBottom: '8px', lineHeight: 1.2 }}>
            Book direct & save 10%
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '20px', lineHeight: 1.5 }}>
            Skip the Airbnb fees. Book direct with us and get 10% off your next stay.
          </p>
          <a
            href={SAMPLE_PROPERTY.bookDirectUrl}
            style={{
              backgroundColor: '#C9A84C', color: '#1A3A4A', padding: '14px 32px',
              borderRadius: '6px', fontSize: '15px', fontWeight: '800',
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            Book Direct →
          </a>
        </div>
      </div>
    </div>
  )
}
