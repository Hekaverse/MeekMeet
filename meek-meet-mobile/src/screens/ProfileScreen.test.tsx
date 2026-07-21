import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProfileScreen from './ProfileScreen'

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

import { useAuth } from '@/hooks/useAuth'

// Build a mock supabase that routes per table
function createMockSupabase(responses: Record<string, { data?: any; error?: any }>) {
  return {
    from: (table: string) => {
      const resp = responses[table] ?? { data: [], error: null }
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
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
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.jpg' } })),
      })),
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
      <ProfileScreen />
    </MemoryRouter>
  )
}

describe('ProfileScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all profile fields for editing', async () => {
    ;(useAuth as any).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    })

    const mockSb = createMockSupabase({
      profiles: {
        data: {
          full_name: 'John Doe',
          location: 'Sydney',
          role: 'member',
          phone: '0400 000 000',
          denomination: 'Anglican',
          bio: 'A friendly person',
          testimony: 'Found faith in 2020',
          avatar_url: null,
        },
        error: null,
      },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Sydney')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0400 000 000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Anglican')).toBeInTheDocument()
    expect(screen.getByDisplayValue('A friendly person')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Found faith in 2020')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('saves profile updates successfully', async () => {
    ;(useAuth as any).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    })

    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const mockSb = createMockSupabase({
      profiles: {
        data: {
          full_name: '',
          location: '',
          role: 'member',
          phone: '',
          denomination: '',
          bio: '',
          testimony: '',
          avatar_url: null,
        },
        error: null,
      },
    })
    vi.mocked(supabase).from = vi.fn((table: string) => {
      const base = mockSb.from(table)
      return { ...base, update: updateMock }
    }) as any

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText('Your name')
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } })

    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }))

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ full_name: 'Jane Smith' })
      )
    })
  })

  it('has a hidden file input for avatar upload', async () => {
    ;(useAuth as any).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    })

    const mockSb = createMockSupabase({
      profiles: {
        data: { full_name: 'John', location: '', role: 'member', avatar_url: null },
        error: null,
      },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument()
    })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp,image/jpg')
  })
})
