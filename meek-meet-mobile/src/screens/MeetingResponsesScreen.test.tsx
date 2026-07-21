import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MeetingResponsesScreen from './MeetingResponsesScreen'

const mockShowToast = vi.fn()

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

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
        <Route path="/shepherd/meetings/:meetingId/responses" element={<MeetingResponsesScreen />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MeetingResponsesScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders attendee names with profiles in the attendee list', async () => {
    const mockSb = createMockSupabase({
      meeting_questions: {
        data: [
          { id: 'mq-1', meeting_id: 'meet-1', question_id: 'q-1', content: 'What are you grateful for?', category: 'Community', order_index: 0, unlock_after_minutes: 0 },
        ],
        error: null,
      },
      responses: {
        data: [
          { id: 'resp-1', meeting_id: 'meet-1', question_id: 'q-1', user_id: 'user-a', content: 'Family and friends', created_at: '2024-01-01T00:00:00Z' },
        ],
        error: null,
      },
      rsvps: {
        data: [
          { user_id: 'user-a', status: 'going', profile: { full_name: 'Alice Smith', email: 'alice@test.com', avatar_url: null, phone: '0400 111 222', denomination: 'Anglican' } },
          { user_id: 'user-b', status: 'going', profile: { full_name: 'Bob Jones', email: 'bob@test.com', avatar_url: 'https://example.com/bob.jpg', phone: null, denomination: 'Baptist' } },
        ],
        error: null,
      },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderAt('/shepherd/meetings/meet-1/responses')

    await waitFor(() => {
      expect(screen.getByText('Responses')).toBeInTheDocument()
    })

    // Attendee section
    expect(screen.getByText(/Attendees \(2\)/i)).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.getByText('0400 111 222')).toBeInTheDocument()
    expect(screen.getByText('Anglican')).toBeInTheDocument()

    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('bob@test.com')).toBeInTheDocument()
    expect(screen.getByText('Baptist')).toBeInTheDocument()

    // Response content still renders
    expect(screen.getByText('Family and friends')).toBeInTheDocument()
  })

  it('shows response rate and attendee count in header', async () => {
    const mockSb = createMockSupabase({
      meeting_questions: {
        data: [
          { id: 'mq-1', meeting_id: 'meet-1', question_id: 'q-1', content: 'What are you grateful for?', category: 'Community', order_index: 0, unlock_after_minutes: 0 },
        ],
        error: null,
      },
      responses: {
        data: [
          { id: 'resp-1', meeting_id: 'meet-1', question_id: 'q-1', user_id: 'user-a', content: 'Family', created_at: '2024-01-01T00:00:00Z' },
        ],
        error: null,
      },
      rsvps: {
        data: [
          { user_id: 'user-a', status: 'going', profile: { full_name: 'Alice Smith', email: 'alice@test.com', avatar_url: null, phone: null, denomination: null } },
          { user_id: 'user-b', status: 'going', profile: { full_name: 'Bob Jones', email: 'bob@test.com', avatar_url: null, phone: null, denomination: null } },
        ],
        error: null,
      },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderAt('/shepherd/meetings/meet-1/responses')

    await waitFor(() => {
      expect(screen.getByText('Responses')).toBeInTheDocument()
    })

    // Header shows count
    expect(screen.getByText(/1 response · 2 attending/i)).toBeInTheDocument()

    // Response rate card
    expect(screen.getByText('Response Rate')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('handles no attendees gracefully', async () => {
    const mockSb = createMockSupabase({
      meeting_questions: {
        data: [
          { id: 'mq-1', meeting_id: 'meet-1', question_id: 'q-1', content: 'What are you grateful for?', category: 'Community', order_index: 0, unlock_after_minutes: 0 },
        ],
        error: null,
      },
      responses: {
        data: [],
        error: null,
      },
      rsvps: {
        data: [],
        error: null,
      },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderAt('/shepherd/meetings/meet-1/responses')

    await waitFor(() => {
      expect(screen.getByText('Responses')).toBeInTheDocument()
    })

    // No attendee section when empty
    expect(screen.queryByText(/Attendees/i)).not.toBeInTheDocument()
    expect(screen.getByText(/0 responses · 0 attending/i)).toBeInTheDocument()
  })
})
