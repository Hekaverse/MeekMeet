import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Loader2, Lock, UserCog } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showReviewLogin, setShowReviewLogin] = useState(false)
  const [error, setError] = useState('')

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'com.meekmeet.app://auth/callback',
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }

    setIsLoading(false)
  }

  const handleReviewLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col safe-top">
      <div className="flex-1 px-6 pt-12 pb-8 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl text-charcoal mb-3">
              Meek Meet
            </h1>
            <p className="text-charcoal-muted">
              Daily scripture. Warm community.
            </p>
          </div>

          {magicLinkSent ? (
            <div className="bg-cream-warm rounded-2xl border border-border-soft p-8 text-center">
              <div className="w-14 h-14 bg-wheat-pale rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-wheat-dark" strokeWidth={1.5} />
              </div>
              <h2 className="font-serif text-xl text-charcoal mb-2">
                Check your email
              </h2>
              <p className="text-sm text-charcoal-muted">
                We sent a magic link to <strong>{email}</strong>. Tap it to sign in.
              </p>
            </div>
          ) : (
            <form
              onSubmit={showReviewLogin ? handleReviewLogin : handleMagicLink}
              className="space-y-4"
            >
              {error && (
                <div className="p-3 bg-terracotta-pale rounded-xl text-sm text-terracotta">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm text-charcoal-light font-medium block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-cream-warm border border-border-soft rounded-xl focus:border-terracotta focus:outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              {showReviewLogin && (
                <div>
                  <label className="text-sm text-charcoal-light font-medium block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-cream-warm border border-border-soft rounded-xl focus:border-terracotta focus:outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : showReviewLogin ? (
                  'Reviewer Sign In'
                ) : (
                  'Send Magic Link'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReviewLogin(!showReviewLogin)
                  setError('')
                  setPassword('')
                }}
                className="w-full py-2 text-xs text-charcoal-muted hover:text-charcoal transition-colors flex items-center justify-center gap-1.5"
              >
                <UserCog className="w-3.5 h-3.5" strokeWidth={1.5} />
                {showReviewLogin ? 'Use magic link instead' : 'Reviewer access'}
              </button>

              <p className="text-center text-xs text-charcoal-muted mt-4">
                By signing in, you agree to our Terms and Privacy Policy.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
