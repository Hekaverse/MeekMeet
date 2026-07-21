import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ContactAdminScreen from './ContactAdminScreen'

const mockNavigate = vi.fn()
const mockShowToast = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

vi.mock('@/lib/haptics', () => ({
  hapticSuccess: vi.fn(),
}))

import { useAuth } from '@/hooks/useAuth'

function createMockSupabase() {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      }),
    },
  }
}

vi.mock('@/lib/supabase', () => ({
  supabase: createMockSupabase(),
}))

function renderScreen() {
  return render(
    <MemoryRouter>
      <ContactAdminScreen />
    </MemoryRouter>
  )
}

describe('ContactAdminScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the contact form', () => {
    ;(useAuth as any).mockReturnValue({
      user: { email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
    })
    renderScreen()

    expect(screen.getByText('Contact Admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText("What's this about?")).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Describe your question, feedback, or issue in detail...')).toBeInTheDocument()
    expect(screen.getByText('Send Message')).toBeInTheDocument()
  })

  it('disables submit button when fields are empty', () => {
    ;(useAuth as any).mockReturnValue({
      user: { email: 'test@example.com', user_metadata: {} },
    })
    renderScreen()

    const btn = screen.getByText('Send Message')
    expect(btn).toBeDisabled()
  })

  it('shows validation error for short message', () => {
    ;(useAuth as any).mockReturnValue({
      user: { email: 'test@example.com', user_metadata: {} },
    })
    renderScreen()

    fireEvent.change(screen.getByPlaceholderText("What's this about?"), { target: { value: 'A valid subject' } })
    fireEvent.change(screen.getByPlaceholderText('Describe your question, feedback, or issue in detail...'), { target: { value: 'short' } })
    fireEvent.click(screen.getByText('Send Message'))
    expect(mockShowToast).toHaveBeenCalledWith('Message must be at least 10 characters', 'error')
  })

  it('submits successfully and shows confirmation', async () => {
    ;(useAuth as any).mockReturnValue({
      user: { email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
    })
    renderScreen()

    fireEvent.change(screen.getByPlaceholderText("What's this about?"), { target: { value: 'Test Subject' } })
    fireEvent.change(screen.getByPlaceholderText('Describe your question, feedback, or issue in detail...'), { target: { value: 'This is a detailed message that is more than ten characters.' } })
    fireEvent.click(screen.getByText('Send Message'))

    await waitFor(() => {
      expect(screen.getByText('Message Sent')).toBeInTheDocument()
    })
  })
})
