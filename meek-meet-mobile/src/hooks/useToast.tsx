import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-12 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`mx-auto max-w-sm w-full pointer-events-auto px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
                toast.type === 'success'
                  ? 'bg-sage text-cream'
                  : toast.type === 'error'
                    ? 'bg-terracotta text-cream'
                    : 'bg-midnight text-cream'
              }`}
            >
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />}
              {toast.type === 'info' && <Info className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
