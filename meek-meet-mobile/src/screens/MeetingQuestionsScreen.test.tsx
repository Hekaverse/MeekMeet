import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MeetingQuestionsScreen from './MeetingQuestionsScreen'

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
        gt: vi.fn().mockReturnThis(),
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

const meetingResponse = {
  data: { scheduled_at: '2030-06-01T10:00:00Z', questions_release_mode: 'live_reveal' },
  error: null,
}

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/shepherd/meetings/meet-1/questions']}>
      <Routes>
        <Route path="/shepherd/meetings/:meetingId/questions" element={<MeetingQuestionsScreen />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MeetingQuestionsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the From the News section with rows when fresh news questions exist', async () => {
    const mockSb = createMockSupabase({
      meetings: meetingResponse,
      news_questions: {
        data: [
          {
            id: 'nq-1',
            question: 'How should faith communities respond to the housing crisis?',
            context: 'Generated from this week’s headlines',
            category: 'News',
          },
          {
            id: 'nq-2',
            question: 'What does the latest election result mean for refugees?',
            context: 'Generated from this week’s headlines',
            category: 'News',
          },
        ],
        error: null,
      },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderScreen()

    // Section header appears above the bundled categories
    await waitFor(() => {
      expect(screen.getByText('From the News')).toBeInTheDocument()
    })

    // Auto-expanded: the news question rows are visible without clicking
    expect(screen.getByText('How should faith communities respond to the housing crisis?')).toBeInTheDocument()
    expect(screen.getByText('What does the latest election result mean for refugees?')).toBeInTheDocument()

    // Bundled pack still renders below
    expect(screen.getByText('Community')).toBeInTheDocument()
  })

  it('renders nothing extra when there are no fresh news questions', async () => {
    const mockSb = createMockSupabase({
      meetings: meetingResponse,
      news_questions: { data: [], error: null },
    })
    vi.mocked(supabase).from = mockSb.from as any

    renderScreen()

    // Wait for the mount fetches to settle (release-mode banner comes from the meetings fetch)
    await waitFor(() => {
      expect(screen.getByText(/Questions will be visible/i)).toBeInTheDocument()
    })

    expect(screen.queryByText('From the News')).not.toBeInTheDocument()
    // Bundled categories still render
    expect(screen.getByText('Community')).toBeInTheDocument()
  })
})
