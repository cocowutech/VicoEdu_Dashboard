'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

const navLinks = [
  { href: '#why-us', label: 'WHY US' },
  { href: '#tech', label: 'THE GLOWGO AI' },
  { href: '#business', label: 'BUSINESS MODEL' },
]

function FixedHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-[15px] font-medium tracking-wide text-[#1f1d1a] md:text-[16px]">
        <nav className="flex gap-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:underline underline-offset-4">
              {link.label}
            </a>
          ))}
        </nav>
        <span className="text-lg font-semibold tracking-widest md:text-xl">GLOWGO</span>
      </div>
    </header>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const handleCta = useCallback(() => {
    router.push('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen bg-white text-[#1f1d1a]">
      <FixedHeader />
      {/* Spacer for fixed header */}
      <div className="h-14" />

      {/* Hero - Page 1 */}
      <section className="min-h-screen flex items-center">
        <div className="mx-auto max-w-6xl px-6 w-full">
          <div className="grid gap-10 md:grid-cols-[1fr,1.2fr] items-center">
            <div className="space-y-6">
              <h1 className="text-3xl font-semibold leading-tight text-[#1f1d1a] md:text-[36px]">
                What It Costs to Treat Yourself ?
              </h1>
              <p className="text-[16px] leading-relaxed text-[#4a4845] md:text-[18px]">
                In top cities like New York and Boston, the average cost for a day of self-care is $400, but finding and booking reliable beauty or wellness services remains stressful and inefficient for busy professionals and students.
              </p>
            </div>
            <div className="relative aspect-[4/5]">
              <Image
                src="/landingpage/Picture1.png"
                alt="Facial treatment closeup"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem - Page 2 */}
      <section id="why-us" className="min-h-screen flex items-center">
        <div className="mx-auto max-w-6xl px-6 w-full">
          <div className="grid gap-10 md:grid-cols-[1fr,1.2fr] items-center">
            <div className="relative aspect-[4/5]">
              <Image
                src="/landingpage/Picture2.png"
                alt="Beauty product textures"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold leading-snug md:text-[32px]">
                Why do 95 million Americans struggle to get convenient, trustworthy self-care bookings?
              </h2>
              <p className="text-[15px] leading-relaxed text-[#4a4845] md:text-[17px]">
                23% of appointments are scheduled within a week, but most platforms cannot surface last-minute opportunities, causing thousands of missed bookings daily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statement & Mosaic - Page 3 */}
      <section id="tech" className="min-h-screen flex items-center bg-[#d2c3a5]">
        <div className="mx-auto max-w-6xl px-6 w-full py-12">
          <div className="text-center mb-12">
            <p className="text-2xl font-medium text-[#1f1d1a] md:text-3xl max-w-2xl mx-auto">
              Current apps and directories are stuck in the past.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-8">
            <div className="relative aspect-square">
              <Image
                src="/landingpage/Picture3.png"
                alt="Applying skincare"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square">
              <Image
                src="/landingpage/Picture4.png"
                alt="Beauty tools on a mat"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square">
              <Image
                src="/landingpage/Picture5.png"
                alt="Spa setup"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square">
              <Image
                src="/landingpage/Picture6.png"
                alt="Wellness product"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          </div>
          <p className="text-[15px] leading-relaxed text-[#4a4845] md:text-[17px]">
            Existing solutions force users to complete endless forms and rely on static provider lists, leaving discovery and booking fragmented. Providers may lose up to 30% revenue to idle slots and no-shows. Only top salons manage to bring 56% more first-timers back for a second visit, the rest see just 45% retention.
          </p>
        </div>
      </section>

      {/* CTA - Page 4 */}
      <section id="business" className="min-h-screen relative overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/landingpage/Picture1.png"
        >
          <source src="/landingpage/Video1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 h-full min-h-screen flex flex-col items-center justify-center text-center px-6">
          <div className="space-y-6 max-w-lg">
            <h3 className="text-2xl font-semibold leading-snug text-white md:text-4xl">
              Reach 15000+ Trusted<br />
              Self-care Service Providers,<br />
              Available in Seconds
            </h3>
            <p className="text-[16px] leading-relaxed text-white/90 md:text-[18px]">
              Elevate Your Beauty Routine with Our Platform
            </p>
            <button
              onClick={handleCta}
              className="mt-6 inline-flex items-center justify-center border-2 border-white px-8 py-3 text-[14px] font-medium tracking-wide text-white transition hover:bg-white hover:text-[#1f1d1a]"
            >
              GLOW NOW
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
