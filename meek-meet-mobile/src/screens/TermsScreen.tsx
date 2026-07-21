import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { hapticSelect } from '@/lib/haptics'

export default function TermsScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-cream safe-top safe-bottom">
      <div className="px-5 pt-4 pb-6">
        <button onClick={() => { hapticSelect(); navigate(-1) }} className="p-2 -ml-2 mb-3">
          <ArrowLeft className="w-5 h-5 text-charcoal" strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-pale flex items-center justify-center">
            <FileText className="w-5 h-5 text-sky-soft" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-xl text-midnight">Terms of Service</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pb-10 space-y-6"
      >
        <p className="text-xs text-charcoal-muted">Last updated: 16 June 2026</p>

        <section>
          <h2 className="font-medium text-midnight mb-2">Welcome</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Meek Meet is a community listening and civic intelligence platform. By using
            Meek Meet, you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Eligibility</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            You must be at least 13 years old to use Meek Meet. Shepherd applicants must be
            adults and complete our verification process.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Account Responsibilities</h2>
          <ul className="space-y-1.5 text-sm text-charcoal-muted list-disc list-inside">
            <li>Keep your account credentials secure</li>
            <li>Provide accurate information</li>
            <li>Do not impersonate others or manipulate results</li>
          </ul>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Community Conduct</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Meek Meet is built on respect and safety. Do not use the platform to harass,
            discriminate, share illegal content, spread misinformation, or de-anonymise
            other users.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Shepherd Verification</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Shepherds are trusted community leaders. By applying, you consent to identity
            and safeguarding verification. False information will result in permanent
            disqualification.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Content and Reports</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            You retain ownership of content you submit. By submitting responses, you grant
            Meek Meet a licence to store and anonymise them for community insights.
            Authority reports contain only aggregated, anonymised data.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Termination</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            We may suspend or terminate accounts that violate these terms or pose a risk to
            community safety. You may delete your account at any time.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Disclaimers</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Meek Meet is provided “as is” without warranties. We are not liable for user
            disputes, authority decisions, or indirect damages arising from platform use.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-midnight mb-2">Contact</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Questions? Reach out at{' '}
            <a href="mailto:legal@meekmeet.com" className="text-terracotta underline">
              legal@meekmeet.com
            </a>
          </p>
        </section>
      </motion.div>
    </div>
  )
}
