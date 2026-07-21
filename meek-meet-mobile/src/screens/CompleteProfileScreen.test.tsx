import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CompleteProfileScreen from './CompleteProfileScreen'

const mockNavigate = vi.fn()

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

import { useAuth } from '@/hooks/useAuth'

function createMockSupabase(responses: Record<string, { data?: any; error?: any }>) {
  return {
    from: (table: string) => {
      const resp = responses[table] ?? { data: [], error: null }
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(resp),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
      const thenable = {
        ...chain,
        then: (onFulfilled: any, onRejected: any) =>
          Promise.resolve(resp).then(onFulfilled, onRejected),
      }
      chain.then = thenable.then
      return chain
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({ subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) }),
    }),
  }
}

vi.mock('@/lib/supabase', () => ({
  supabase: createMockSupabase({}),
}))

import { supabase } from '@/lib/supabase'

function renderScreen() {
  return render(
    <MemoryRouter>
      <CompleteProfileScreen />
    </MemoryRouter>
  )
}

describe('CompleteProfileScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the profile completion form', async () => {
    ;(useAuth as any).mockReturnValue({ user: { id: 'user-1' } })

    const mockSb = createMockSupabase({
      profiles: { data: { full_name: null, location: null, denomination: null, bio: null }, error: null },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Start typing your suburb...')).toBeInTheDocument()
    expect(screen.getByText('Select your tradition')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('A little about yourself, your story, or what brings you here...')).toBeInTheDocument()
    expect(screen.getByText('Matthew 5:5')).toBeInTheDocument()
  })

  it('disables continue button when name is empty', async () => {
    ;(useAuth as any).mockReturnValue({ user: { id: 'user-1' } })

    const mockSb = createMockSupabase({
      profiles: { data: { full_name: null, location: null, denomination: null, bio: null }, error: null },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument()
    })

    const continueButton = screen.getByRole('button', { name: /Continue/i })
    expect(continueButton).toBeDisabled()
  })

  it('saves profile via upsert and navigates home', async () => {
    ;(useAuth as any).mockReturnValue({ user: { id: 'user-1' } })

    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const mockSb = createMockSupabase({
      profiles: { data: { full_name: null, location: null, denomination: null, bio: null }, error: null },
    })
    vi.mocked(supabase).from = vi.fn((table: string) => {
      const base = mockSb.from(table)
      return { ...base, upsert: upsertMock }
    }) as any

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText('Start typing your suburb...'), { target: { value: 'Melbourne' } })

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ full_name: 'Alice', location: 'Melbourne' }),
        expect.anything()
      )
    })
  })

  it('allows skipping the profile completion', async () => {
    ;(useAuth as any).mockReturnValue({ user: { id: 'user-1' } })

    const mockSb = createMockSupabase({
      profiles: { data: { full_name: null, location: null, denomination: null, bio: null }, error: null },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Skip for now/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })
})
