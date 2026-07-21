import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ShepherdManageScreen from './ShepherdManageScreen'

const mockShowToast = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

vi.mock('@/lib/notifications', () => ({
  scheduleMeetingNotifications: vi.fn(),
  cancelMeetingNotifications: vi.fn(),
}))

import { useAuth } from '@/hooks/useAuth'

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
        delete: vi.fn().mockReturnThis(),
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

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/shepherd/:circleId/:tab" element={<ShepherdManageScreen />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ShepherdManageScreen Members tab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({ user: { id: 'shepherd-1', email: 'shepherd@test.com' } })
  })

  it('renders the members tab with member cards', async () => {
    const mockSb = createMockSupabase({
      circles: {
        data: { id: 'circle-1', name: 'Test Circle', location: 'Sydney', description: null, meeting_place: null, meeting_address: null, image_url: null, shepherd_id: 'shepherd-1', is_active: true },
        error: null,
      },
      meetings: {
        data: [{ id: 'meet-1' }, { id: 'meet-2' }],
        error: null,
      },
      rsvps: {
        data: [
          { user_id: 'user-a', status: 'going', profile: { full_name: 'Alice Smith', email: 'alice@test.com', avatar_url: null, phone: '0400 111 222', denomination: 'Anglican', bio: 'Love Jesus', testimony: 'Saved in 2019' } },
          { user_id: 'user-b', status: 'going', profile: { full_name: 'Bob Jones', email: 'bob@test.com', avatar_url: null, phone: null, denomination: 'Baptist', bio: null, testimony: null } },
          { user_id: 'user-a', status: 'going', profile: { full_name: 'Alice Smith', email: 'alice@test.com', avatar_url: null, phone: '0400 111 222', denomination: 'Anglican', bio: 'Love Jesus', testimony: 'Saved in 2019' } },
        ],
        error: null,
      },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderAt('/shepherd/circle-1/members')

    await waitFor(() => {
      expect(screen.getByText('Test Circle')).toBeInTheDocument()
    })

    // Alice should appear once (deduplicated) with 2 RSVPs
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.getByText('0400 111 222')).toBeInTheDocument()
    expect(screen.getByText('Anglican')).toBeInTheDocument()
    expect(screen.getByText('Love Jesus')).toBeInTheDocument()
    expect(screen.getByText('Saved in 2019')).toBeInTheDocument()
    expect(screen.getByText('2 meets attended')).toBeInTheDocument()

    // Bob should appear
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('bob@test.com')).toBeInTheDocument()
    expect(screen.getByText('Baptist')).toBeInTheDocument()
    expect(screen.getByText('1 meet attended')).toBeInTheDocument()

    // Summary count
    expect(screen.getByText(/2 members/i)).toBeInTheDocument()
    expect(screen.getByText(/3 total attendances/i)).toBeInTheDocument()
  })

  it('filters members by search query', async () => {
    const mockSb = createMockSupabase({
      circles: {
        data: { id: 'circle-1', name: 'Test Circle', location: 'Sydney', description: null, meeting_place: null, meeting_address: null, image_url: null, shepherd_id: 'shepherd-1', is_active: true },
        error: null,
      },
      meetings: {
        data: [{ id: 'meet-1' }],
        error: null,
      },
      rsvps: {
        data: [
          { user_id: 'user-a', status: 'going', profile: { full_name: 'Alice Smith', email: 'alice@test.com', avatar_url: null, phone: null, denomination: 'Anglican', bio: null, testimony: null } },
          { user_id: 'user-b', status: 'going', profile: { full_name: 'Bob Jones', email: 'bob@test.com', avatar_url: null, phone: null, denomination: 'Baptist', bio: null, testimony: null } },
        ],
        error: null,
      },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderAt('/shepherd/circle-1/members')

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText('Search members...')
    fireEvent.change(searchInput, { target: { value: 'alice' } })

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
  })

  it('shows empty state when no members exist', async () => {
    const mockSb = createMockSupabase({
      circles: {
        data: { id: 'circle-1', name: 'Test Circle', location: 'Sydney', description: null, meeting_place: null, meeting_address: null, image_url: null, shepherd_id: 'shepherd-1', is_active: true },
        error: null,
      },
      meetings: {
        data: [],
        error: null,
      },
      rsvps: {
        data: [],
        error: null,
      },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderAt('/shepherd/circle-1/members')

    await waitFor(() => {
      expect(screen.getByText('Test Circle')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('No members yet.')).toBeInTheDocument()
    })
    expect(screen.getByText('Members will appear once people RSVP to your meetings.')).toBeInTheDocument()
  })
})
