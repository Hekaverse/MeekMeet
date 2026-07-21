const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'of', 'and', 'in', 'that', 'have', 'i', 'it', 'for', 'not',
  'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
  'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will',
  'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
  'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
  'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its',
  'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our',
  'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  'any', 'these', 'give', 'day', 'most', 'us', 'very', 'much', 'more',
  'many', 'should', 'may', 'need', 'help', 'must', 'really', 'too',
  'still', 'own', 'under', 'while', 'last', 'might', 'great', 'old',
  'never', 'always', 'find', 'here', 'things', 'something', 'someone',
  'place', 'right', 'put', 'end', 'why', 'again', 'off', 'went',
  'tell', 'men', 'say', 'part', 'both', 'between', 'each', 'few',
  'does', 'done', 'doing', 'has', 'had', 'having', 'were', 'where',
  'which', 'who', 'whom', 'whose', 'what', 'when', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should',
  'now', 'get', 'got', 'goes', 'going', 'went', 'gone', 'come',
  'came', 'coming', 'make', 'made', 'making', 'take', 'took', 'taking',
  'see', 'saw', 'seen', 'seeing', 'know', 'knew', 'known', 'knowing',
  'think', 'thought', 'thinking', 'say', 'said', 'saying', 'get',
  'give', 'gave', 'given', 'giving', 'find', 'found', 'finding',
  'tell', 'told', 'telling', 'feel', 'felt', 'feeling', 'become',
  'became', 'becoming', 'leave', 'left', 'leaving', 'put', 'putting',
  'mean', 'meant', 'meaning', 'keep', 'kept', 'keeping', 'let',
  'begin', 'began', 'begun', 'beginning', 'seem', 'seemed', 'seeming',
  'help', 'helped', 'helping', 'show', 'showed', 'shown', 'showing',
  'hear', 'heard', 'hearing', 'play', 'played', 'playing', 'run',
  'ran', 'running', 'move', 'moved', 'moving', 'live', 'lived',
  'living', 'believe', 'believed', 'believing', 'bring', 'brought',
  'bringing', 'happen', 'happened', 'happening', 'write', 'wrote',
  'written', 'writing', 'provide', 'provided', 'providing', 'sit',
  'sat', 'sitting', 'stand', 'stood', 'standing', 'lose', 'lost',
  'losing', 'pay', 'paid', 'paying', 'meet', 'met', 'meeting',
  'include', 'included', 'including', 'continue', 'continued',
  'continuing', 'set', 'setting', 'learn', 'learned', 'learning',
  'change', 'changed', 'changing', 'lead', 'led', 'leading',
  'understand', 'understood', 'understanding', 'watch', 'watched',
  'watching', 'follow', 'followed', 'following', 'stop', 'stopped',
  'stopping', 'create', 'created', 'creating', 'speak', 'spoke',
  'spoken', 'speaking', 'read', 'reading', 'allow', 'allowed',
  'allowing', 'add', 'added', 'adding', 'spend', 'spent', 'spending',
  'grow', 'grew', 'grown', 'growing', 'open', 'opened', 'opening',
  'walk', 'walked', 'walking', 'win', 'won', 'winning', 'offer',
  'offered', 'offering', 'remember', 'remembered', 'remembering',
  'love', 'loved', 'loving', 'consider', 'considered', 'considering',
  'appear', 'appeared', 'appearing', 'buy', 'bought', 'buying',
  'wait', 'waited', 'waiting', 'serve', 'served', 'serving',
  'die', 'died', 'dying', 'send', 'sent', 'sending', 'expect',
  'expected', 'expecting', 'build', 'built', 'building', 'stay',
  'stayed', 'staying', 'fall', 'fell', 'fallen', 'falling',
  'cut', 'cutting', 'reach', 'reached', 'reaching', 'kill',
  'killed', 'killing', 'remain', 'remained', 'remaining',
])

export interface WordFrequency {
  word: string
  count: number
}

export interface ThemeExtraction {
  topWords: WordFrequency[]
  totalWords: number
  uniqueWords: number
}

export function extractThemes(texts: string[]): ThemeExtraction {
  const wordCounts: Record<string, number> = {}
  let totalWords = 0

  for (const text of texts) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))

    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1
      totalWords++
    }
  }

  const topWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  return {
    topWords,
    totalWords,
    uniqueWords: Object.keys(wordCounts).length,
  }
}

export function calculateThreshold(
  responseCount: number,
  attendeeCount: number
): { percentage: number; reached: boolean } {
  if (attendeeCount === 0) return { percentage: 0, reached: false }
  const percentage = Math.round((responseCount / attendeeCount) * 100)
  return { percentage, reached: percentage >= 60 }
}
