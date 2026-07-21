import { motion } from 'framer-motion'

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-cream-warm rounded-2xl border border-border-soft overflow-hidden ${className}`}>
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <SkeletonCircle className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="w-3/4 h-4" />
            <SkeletonLine className="w-1/2 h-3" />
          </div>
        </div>
        <SkeletonLine className="w-full h-3" />
        <SkeletonLine className="w-5/6 h-3" />
      </div>
    </div>
  )
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-midnight/5 rounded-md relative overflow-hidden ${className}`}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-midnight/5 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      />
    </div>
  )
}

export function SkeletonCircle({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-midnight/5 rounded-full relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-midnight/5 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      />
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="px-6 pt-8 pb-10 text-center space-y-4">
      <SkeletonCircle className="w-32 h-32 mx-auto" />
      <SkeletonLine className="w-40 h-8 mx-auto" />
      <SkeletonLine className="w-64 h-4 mx-auto" />
      <SkeletonLine className="w-56 h-4 mx-auto" />
    </div>
  )
}
