import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboardScreen from './AdminDashboardScreen'

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

// Build a mock supabase that routes per table; rpc responses keyed as `rpc:<fnName>`
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
      // Make the chain itself thenable so `await q` works
      const thenable = {
        ...chain,
        then: (onFulfilled: any, onRejected: any) =>
          Promise.resolve(resp).then(onFulfilled, onRejected),
      }
      chain.then = thenable.then
      return chain
    },
    rpc: vi.fn((fn: string) =>
      Promise.resolve(responses[`rpc:${fn}`] ?? { data: null, error: null })
    ),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({ subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) }),
    }),
  }
}

vi.mock('@/lib/supabase', () => ({
  supabase: createMockSupabase({}),
}))

import { supabase } from '@/lib/supabase'

function mockSupabase(mockSb: ReturnType<typeof createMockSupabase>) {
  vi.mocked(supabase).from = mockSb.from as any
  vi.mocked(supabase).rpc = mockSb.rpc as any
  vi.mocked(supabase).channel = mockSb.channel as any
}

function renderScreen() {
  return render(
    <MemoryRouter>
      <AdminDashboardScreen />
    </MemoryRouter>
  )
}

const emptyStats = {
  total_shepherds: 1,
  total_circles: 1,
  total_scheduled_meetings: 0,
  total_completed_meetings: 0,
  pending_applications: 0,
  total_members: 1,
  total_responses: 0,
  active_rsvps: 0,
}

describe('AdminDashboardScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows access denied for non-admin', () => {
    ;(useAuth as any).mockReturnValue({ user: { email: 'member@test.com' }, role: 'member' })
    renderScreen()
    expect(screen.getByText(/You do not have access/i)).toBeInTheDocument()
  })

  it('shows loading then overview stats for admin', async () => {
    ;(useAuth as any).mockReturnValue({ user: { email: 'admin@test.com' }, role: 'admin' })

    const mockSb = createMockSupabase({
      'rpc:get_admin_stats': {
        data: {
          total_shepherds: 5,
          total_circles: 3,
          total_scheduled_meetings: 2,
          total_completed_meetings: 10,
          pending_applications: 1,
          total_members: 42,
          total_responses: 120,
          active_rsvps: 8,
        },
        error: null,
      },
    })
    mockSupabase(mockSb)

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    // Unique stat values that won't collide with tab labels or quick-link counts
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(mockSb.rpc).toHaveBeenCalledWith('get_admin_stats')
  })

  it('switches to applications tab and shows filter buttons', async () => {
    ;(useAuth as any).mockReturnValue({ user: { email: 'admin@test.com' }, role: 'admin' })

    const mockSb = createMockSupabase({
      'rpc:get_admin_stats': { data: emptyStats, error: null },
      shepherd_applications: {
        data: [
          {
            id: 'app-1',
            full_name: 'John Doe',
            email: 'john@example.com',
            location: 'Sydney',
            tradition: 'Baptist',
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z',
            user_id: 'user-1',
          },
        ],
        error: null,
      },
    })
    mockSupabase(mockSb)

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Applications'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Pending/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Approved/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Rejected/i })).toBeInTheDocument()
    })
  })

  it('switches to inbox tab and shows messages', async () => {
    ;(useAuth as any).mockReturnValue({ user: { email: 'admin@test.com', id: 'admin-1' }, role: 'admin' })

    const mockSb = createMockSupabase({
      'rpc:get_admin_stats': { data: emptyStats, error: null },
      admin_messages: {
        data: [
          {
            id: 'msg-1',
            user_id: 'user-1',
            name: 'Alice',
            email: 'alice@test.com',
            subject: 'Need help',
            message: 'I cannot join a circle.',
            status: 'open',
            created_at: '2024-01-01T00:00:00Z',
            resolved_at: null,
            resolved_by: null,
          },
        ],
        error: null,
      },
    })
    mockSupabase(mockSb)

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Inbox'))

    await waitFor(() => {
      expect(screen.getByText('Need help')).toBeInTheDocument()
      expect(screen.getByText('open')).toBeInTheDocument()
    })
  })

  it('subscribes to realtime application changes', async () => {
    ;(useAuth as any).mockReturnValue({ user: { email: 'admin@test.com' }, role: 'admin' })

    const mockSb = createMockSupabase({
      'rpc:get_admin_stats': { data: emptyStats, error: null },
    })
    vi.mocked(supabase).from = mockSb.from as any
    vi.mocked(supabase).rpc = mockSb.rpc as any
    const channelMock = vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({ subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) }),
    })
    vi.mocked(supabase).channel = channelMock as any

    renderScreen()

    await waitFor(() => {
      expect(channelMock).toHaveBeenCalledWith('admin-applications')
    })
  })

  it('switches to questions tab and shows 144 questions across 10 categories', async () => {
    ;(useAuth as any).mockReturnValue({ user: { email: 'admin@test.com' }, role: 'admin' })

    const mockSb = createMockSupabase({
      'rpc:get_admin_stats': { data: emptyStats, error: null },
    })
    mockSupabase(mockSb)

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Questions'))

    await waitFor(() => {
      expect(screen.getByText('Universal Question Pool')).toBeInTheDocument()
      expect(screen.getByText(/144 questions across 10 categories/i)).toBeInTheDocument()
      expect(screen.getByText('Community')).toBeInTheDocument()
      expect(screen.getByText('Governance')).toBeInTheDocument()
    })
  })

  it('shows confirmation modal when approving an application', async () => {
    ;(useAuth as any).mockReturnValue({ user: { email: 'admin@test.com' }, role: 'admin' })

    const mockSb = createMockSupabase({
      'rpc:get_admin_stats': { data: { ...emptyStats, pending_applications: 1 }, error: null },
      shepherd_applications: {
        data: [
          {
            id: 'app-1',
            full_name: 'Jane Doe',
            email: 'jane@example.com',
            location: 'Brisbane',
            tradition: 'Anglican',
            status: 'pending',
            created_at: '2024-01-01T00:00:00Z',
            user_id: 'user-1',
          },
        ],
        error: null,
      },
    })
    mockSupabase(mockSb)

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Applications'))

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    // Click the approve button in the application card (first one)
    const approveButtons = screen.getAllByRole('button', { name: /^Approve$/i })
    fireEvent.click(approveButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Approve Application?')).toBeInTheDocument()
    })

    // Click the confirm button in the modal (second Approve button)
    const confirmButtons = screen.getAllByRole('button', { name: /^Approve$/i })
    fireEvent.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => {
      expect(mockSb.rpc).toHaveBeenCalledWith('review_shepherd_application', {
        p_application_id: 'app-1',
        p_decision: 'approved',
      })
      expect(mockShowToast).toHaveBeenCalledWith('Application approved', 'success')
    })
  })

  it('shows error state with retry button when loading fails', async () => {
    ;(useAuth as any).mockReturnValue({ user: { email: 'admin@test.com' }, role: 'admin' })

    const mockSb = createMockSupabase({
      'rpc:get_admin_stats': { data: null, error: { message: 'Connection timeout' } },
    })
    mockSupabase(mockSb)

    renderScreen()

    await waitFor(() => {
      expect(screen.getByText(/Failed to load stats/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
  })

  it('subscribes to realtime admin-messages channel', async () => {
    ;(useAuth as any).mockReturnValue({ user: { email: 'admin@test.com' }, role: 'admin' })

    const mockSb = createMockSupabase({
      'rpc:get_admin_stats': { data: emptyStats, error: null },
    })
    vi.mocked(supabase).from = mockSb.from as any
    vi.mocked(supabase).rpc = mockSb.rpc as any
    const channelMock = vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({ subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) }),
    })
    vi.mocked(supabase).channel = channelMock as any

    renderScreen()

    await waitFor(() => {
      expect(channelMock).toHaveBeenCalledWith('admin-messages')
    })
  })
})
