import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { hapticSelect } from '@/lib/haptics'

export default function PrivacyScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-cream safe-top safe-bottom">
      <div className="px-5 pt-4 pb-6">
        <button onClick={() => { hapticSelect(); navigate(-1) }} className="p-2 -ml-2 mb-3">
          <ArrowLeft className="w-5 h-5 text-charcoal" strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage-pale flex items-center justify-center">
            <Shield className="w-5 h-5 text-sage-dark" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-xl text-midnight">Privacy Policy</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pb-10 space-y-6"
      >
        <p className="text-xs text-charcoal-muted">Last updated: 16 June 2026</p>

        <section>
          <h2 className="font-medium text-midnight mb-2">Our Commitment</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Meek Meet is committed to protecting your privacy. We collect only what is
            necessary to provide the service, and we never sell your data.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">What We Collect</h2>
          <ul className="space-y-1.5 text-sm text-charcoal-muted list-disc list-inside">
            <li>Name and email address for authentication</li>
            <li>Reading progress, bookmarks, and highlights</li>
            <li>Circle membership and meeting participation</li>
            <li>Community responses submitted during gatherings</li>
            <li>Location data when you explicitly use Circles</li>
            <li>Verification documents if you apply to become a shepherd</li>
          </ul>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">How We Use Data</h2>
          <ul className="space-y-1.5 text-sm text-charcoal-muted list-disc list-inside">
            <li>To provide and improve the Meek Meet platform</li>
            <li>To verify shepherd applicants and protect communities</li>
            <li>To generate anonymised, aggregated community insights</li>
            <li>To send meeting reminders and important updates</li>
          </ul>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Anonymisation</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Individual responses are never exposed publicly. We use AI to synthesise themes,
            sentiment, and consensus from aggregated input. Reports shared with authorities
            contain only anonymised summaries.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Who Can See Your Data</h2>
          <ul className="space-y-1.5 text-sm text-charcoal-muted list-disc list-inside">
            <li>You can see your own responses and profile</li>
            <li>Circle shepherds can see responses in their circle</li>
            <li>Admins can see data needed for safety and support</li>
            <li>Anonymised insights may be shown publicly</li>
          </ul>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Third-Party Services</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            We use Supabase (database, auth, storage), Resend (email), Groq (AI synthesis),
            Google Places (nearby discovery), and Google Maps (optional geocoding).
          </p>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Your Rights</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            You can delete your account and personal data at any time. Deleting your account
            removes your profile and individual responses; anonymised aggregated insights may
            be retained as statistical data.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Contact</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Questions? Reach out at{' '}
            <a href="mailto:privacy@meekmeet.com" className="text-terracotta underline">
              privacy@meekmeet.com
            </a>
          </p>
        </section>
      </motion.div>
    </div>
  )
}
