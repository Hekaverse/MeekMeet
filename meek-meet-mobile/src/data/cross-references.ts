import type { CrossReference } from '@/types'

/**
 * Cross-reference engine: maps verses from one tradition to related verses
 * in other traditions on shared themes.
 *
 * Key format: "tradition:bookId:chapter:verse"
 * Uses fuzzy matching — if an exact verse isn't mapped, we look for
 * a chapter-level fallback.
 */

const refs: CrossReference[] = [
  // ── Creation ───────────────────────────────────────
  {
    fromKey: 'bible:genesis:1:1',
    theme: 'Creation',
    related: [
      { tradition: 'quran', bookId: '2', book: 'Al-Baqarah', chapter: 2, verse: 29, text: 'He it is Who created for you all that is in the earth. Then turned He to the heaven, and fashioned it as seven heavens.' },
      { tradition: 'buddhist', bookId: 'dhammapada', book: 'The Dhammapada', chapter: 1, verse: 1, text: 'All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts.' },
      { tradition: 'mormon', bookId: '1_nephi', book: '1 Nephi', chapter: 1, verse: 14, text: 'Yea, having had a great knowledge of the goodness and the mysteries of God, therefore I make a record of my proceedings in my days.' },
    ],
  },
  {
    fromKey: 'tanakh:genesis:1:1',
    theme: 'Creation',
    related: [
      { tradition: 'quran', bookId: '2', book: 'Al-Baqarah', chapter: 2, verse: 29, text: 'He it is Who created for you all that is in the earth. Then turned He to the heaven, and fashioned it as seven heavens.' },
      { tradition: 'bible', bookId: 'john', book: 'John', chapter: 1, verse: 1, text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
    ],
  },
  {
    fromKey: 'quran:2:2:29',
    theme: 'Creation',
    related: [
      { tradition: 'bible', bookId: 'genesis', book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning God created the heaven and the earth.' },
      { tradition: 'tanakh', bookId: 'genesis', book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning God created the heaven and the earth.' },
    ],
  },

  // ── Love / Compassion ──────────────────────────────
  {
    fromKey: 'bible:matthew:5:44',
    theme: 'Love Your Enemy',
    related: [
      { tradition: 'quran', bookId: '41', book: 'Fussilat', chapter: 41, verse: 34, text: 'The good deed and the evil deed are not alike. Repel the evil deed with one which is better, then lo! he, between whom and thee there was enmity (will become) as though he was a bosom friend.' },
      { tradition: 'buddhist', bookId: 'dhammapada', book: 'The Dhammapada', chapter: 1, verse: 5, text: 'For hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule.' },
    ],
  },
  {
    fromKey: 'tanakh:leviticus:19:18',
    theme: 'Love Your Neighbor',
    related: [
      { tradition: 'bible', bookId: 'matthew', book: 'Matthew', chapter: 22, verse: 39, text: 'And the second is like unto it, Thou shalt love thy neighbour as thyself.' },
      { tradition: 'quran', bookId: '4', book: 'An-Nisa', chapter: 4, verse: 36, text: '(Show) kindness unto parents, and unto near kindred, and orphans, and the needy, and unto the neighbour who is of kin (unto you) and the neighbour who is not of kin...' },
    ],
  },
  {
    fromKey: 'bible:luke:10:33',
    theme: 'Compassion for the Stranger',
    related: [
      { tradition: 'quran', bookId: '4', book: 'An-Nisa', chapter: 4, verse: 36, text: '(Show) kindness unto... the fellow-traveller and the wayfarer...' },
      { tradition: 'tanakh', bookId: 'leviticus', book: 'Leviticus', chapter: 19, verse: 34, text: 'But the stranger that dwelleth with you shall be unto you as one born among you, and thou shalt love him as thyself.' },
    ],
  },

  // ── Justice ────────────────────────────────────────
  {
    fromKey: 'bible:micah:6:8',
    theme: 'Justice',
    related: [
      { tradition: 'quran', bookId: '4', book: 'An-Nisa', chapter: 4, verse: 135, text: 'Be ye staunch in justice, witnesses for Allah, even though it be against yourselves or (your) parents or (your) kindred...' },
      { tradition: 'buddhist', bookId: 'dhammapada', book: 'The Dhammapada', chapter: 19, verse: 258, text: 'He is not therefore an Ariya because he injures living beings; he is therefore an Ariya because he does not injure living beings.' },
    ],
  },
  {
    fromKey: 'tanakh:amos:5:24',
    theme: 'Justice',
    related: [
      { tradition: 'bible', bookId: 'james', book: 'James', chapter: 2, verse: 17, text: 'Even so faith, if it hath not works, is dead, being alone.' },
      { tradition: 'quran', bookId: '5', book: 'Al-Ma\'idah', chapter: 5, verse: 8, text: 'O ye who believe! Be steadfast witnesses for Allah in equity, and let not hatred of any people seduce you that ye deal not justly.' },
    ],
  },

  // ── Forgiveness ────────────────────────────────────
  {
    fromKey: 'bible:matthew:18:21',
    theme: 'Forgiveness',
    related: [
      { tradition: 'quran', bookId: '39', book: 'Az-Zumar', chapter: 39, verse: 53, text: 'Despair not of the mercy of Allah, Who forgiveth all sins. Lo! He is the Forgiving, the Merciful.' },
      { tradition: 'buddhist', bookId: 'dhammapada', book: 'The Dhammapada', chapter: 1, verse: 5, text: 'For hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule.' },
    ],
  },
  {
    fromKey: 'tanakh:psalms:103:12',
    theme: 'Forgiveness',
    related: [
      { tradition: 'bible', bookId: 'luke', book: 'Luke', chapter: 23, verse: 34, text: 'Then said Jesus, Father, forgive them; for they know not what they do.' },
      { tradition: 'quran', bookId: '42', book: 'Ash-Shura', chapter: 42, verse: 40, text: 'Whosoever pardoneth and amendeth, his wage is the affair of Allah.' },
    ],
  },

  // ── Light / Guidance ───────────────────────────────
  {
    fromKey: 'bible:john:1:1',
    theme: 'The Word & Light',
    related: [
      { tradition: 'tanakh', bookId: 'genesis', book: 'Genesis', chapter: 1, verse: 3, text: 'And God said: Let there be light. And there was light.' },
      { tradition: 'quran', bookId: '24', book: 'An-Nur', chapter: 24, verse: 35, text: 'Allah is the Light of the heavens and the earth. The similitude of His light is as a niche wherein is a lamp...' },
    ],
  },
  {
    fromKey: 'quran:24:24:35',
    theme: 'Divine Light',
    related: [
      { tradition: 'bible', bookId: 'john', book: 'John', chapter: 1, verse: 9, text: 'That was the true Light, which lighteth every man that cometh into the world.' },
      { tradition: 'buddhist', bookId: 'dhammapada', book: 'The Dhammapada', chapter: 6, verse: 89, text: 'Those whose mind is well grounded in the elements of enlightenment, who without clinging to anything rejoice in freedom from attachment...' },
    ],
  },

  // ── Humility / Meekness ────────────────────────────
  {
    fromKey: 'bible:matthew:5:5',
    theme: 'The Meek',
    related: [
      { tradition: 'buddhist', bookId: 'dhammapada', book: 'The Dhammapada', chapter: 15, verse: 197, text: 'Let us live happily then, not hating those who hate us! among men who hate us let us dwell free from hatred!' },
      { tradition: 'quran', bookId: '25', book: 'Al-Furqan', chapter: 25, verse: 63, text: 'The slaves of the Beneficent are they who walk upon the earth modestly, and when the foolish ones address them answer: Peace.' },
    ],
  },
  {
    fromKey: 'buddhist:dhammapada:15:197',
    theme: 'Non-Hatred',
    related: [
      { tradition: 'bible', bookId: 'matthew', book: 'Matthew', chapter: 5, verse: 44, text: 'Love your enemies, bless them that curse you, do good to them that hate you...' },
      { tradition: 'tanakh', bookId: 'proverbs', book: 'Proverbs', chapter: 25, verse: 21, text: 'If thine enemy be hungry, give him bread to eat; and if he be thirsty, give him water to drink.' },
    ],
  },

  // ── Service ────────────────────────────────────────
  {
    fromKey: 'mormon:mosiah:2:17',
    theme: 'Service',
    related: [
      { tradition: 'bible', bookId: 'matthew', book: 'Matthew', chapter: 25, verse: 40, text: 'Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me.' },
      { tradition: 'quran', bookId: '2', book: 'Al-Baqarah', chapter: 2, verse: 195, text: 'Spend of your good things and render not evil for evil. Do good. Lo! Allah loveth the beneficent.' },
    ],
  },

  // ── Truth / Honesty ────────────────────────────────
  {
    fromKey: 'bible:john:8:32',
    theme: 'Truth',
    related: [
      { tradition: 'quran', bookId: '17', book: 'Al-Isra', chapter: 17, verse: 81, text: 'And say: Truth hath come and falsehood hath vanished away. Lo! falsehood is ever bound to vanish.' },
      { tradition: 'buddhist', bookId: 'dhammapada', book: 'The Dhammapada', chapter: 12, verse: 165, text: 'By oneself the evil is done, by oneself one suffers; by oneself the evil is left undone, by oneself one is purified.' },
    ],
  },

  // ── Patience / Perseverance ────────────────────────
  {
    fromKey: 'bible:romans:5:3',
    theme: 'Patience',
    related: [
      { tradition: 'quran', bookId: '2', book: 'Al-Baqarah', chapter: 2, verse: 153, text: 'O ye who believe! Seek help in patience and prayer; lo! Allah is with the steadfast.' },
      { tradition: 'buddhist', bookId: 'dhammapada', book: 'The Dhammapada', chapter: 8, verse: 109, text: 'For whoever is self-concentrated, pure, well informed and self-controlled, that man may be able to bear even the wearing of the yellow robe.' },
    ],
  },

  // ── The Golden Rule ────────────────────────────────
  {
    fromKey: 'bible:matthew:7:12',
    theme: 'The Golden Rule',
    related: [
      { tradition: 'tanakh', bookId: 'leviticus', book: 'Leviticus', chapter: 19, verse: 18, text: 'Thou shalt love thy neighbour as thyself: I am the Lord.' },
      { tradition: 'quran', bookId: '4', book: 'An-Nisa', chapter: 4, verse: 36, text: '(Show) kindness unto parents, and unto near kindred, and orphans, and the needy, and unto the neighbour...' },
      { tradition: 'buddhist', bookId: 'dhammapada', book: 'The Dhammapada', chapter: 10, verse: 130, text: 'Let none by any deed of his harm any one, nor let him despise any one in any condition, in any place, in any way.' },
    ],
  },
]

// Build a lookup map for O(1) access
const refMap = new Map<string, CrossReference>()
for (const r of refs) {
  refMap.set(r.fromKey, r)
}

export function getCrossReferences(
  tradition: string,
  bookId: string,
  chapter: number,
  verse: number
): CrossReference | null {
  const exactKey = `${tradition}:${bookId}:${chapter}:${verse}`
  if (refMap.has(exactKey)) return refMap.get(exactKey)!

  // Try chapter-level fallback
  const chapterKey = `${tradition}:${bookId}:${chapter}:0`
  if (refMap.has(chapterKey)) return refMap.get(chapterKey)!

  return null
}

export function getRelatedVerses(
  tradition: string,
  bookId: string,
  chapter: number,
  verse: number
): CrossReference['related'] {
  const ref = getCrossReferences(tradition, bookId, chapter, verse)
  return ref?.related.filter((r) => r.tradition !== tradition) ?? []
}
