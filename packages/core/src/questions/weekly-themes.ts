import type { WeeklyTheme } from '../types'

export const weeklyThemes: WeeklyTheme[] = [
  {
    id: 'creation',
    name: 'The Act of Creation',
    subtitle: 'How the world began, across every tradition',
    description:
      'Every sacred text begins with wonder. This week, travel through five accounts of creation — from the cosmic gardens of Genesis to the measured breath of the Dhammapada. Each day reveals a different face of the mystery: order, chaos, light, and the divine word that calls it all into being.',
    color: 'bg-sky-pale text-sky-soft',
    days: [
      {
        tradition: 'bible',
        bookId: 'genesis',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created the heaven and the earth.',
        reflection:
          'The Hebrew word for "create" here — bara — is used only for divine acts. It speaks of making something from nothing, a power reserved for the sacred alone. Notice how creation unfolds in rhythm: evening and morning, the first day.',
      },
      {
        tradition: 'quran',
        bookId: '2',
        book: 'Al-Baqarah',
        chapter: 2,
        verse: 29,
        text: 'He it is Who created for you all that is in the earth. Then turned He to the heaven, and fashioned it as seven heavens. And He is Knower of all things.',
        reflection:
          'In the Quranic account, the earth is fashioned first — a home prepared before the sky is built above it. This ordering speaks of divine care: the dwelling place matters before the celestial architecture.',
      },
      {
        tradition: 'buddhist',
        bookId: 'dhammapada',
        book: 'The Dhammapada',
        chapter: 1,
        verse: 1,
        text: 'All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts.',
        reflection:
          'The Buddha does not begin with a creator but with consciousness itself. The world is not made by an external hand — it is shaped by the mind that perceives it. What would change if you saw your thoughts as creative acts?',
      },
      {
        tradition: 'tanakh',
        bookId: 'genesis',
        book: 'Genesis',
        chapter: 1,
        verse: 3,
        text: 'And God said: Let there be light. And there was light.',
        reflection:
          'Light before sun — this is not physical light but the first differentiation. Darkness and light are separated, named, given boundaries. To create is to draw a line and call one side sacred.',
      },
      {
        tradition: 'mormon',
        bookId: '2_nephi',
        book: '2 Nephi',
        chapter: 2,
        verse: 14,
        text: 'And now, my sons, I speak unto you these things for your profit and learning; for there is a God, and he hath created all things, both the heavens and the earth, and all things that in them are, both things to act and things to be acted upon.',
        reflection:
          'Creation here is not merely material but moral — the world is made of agents and objects, choice and consequence. To be created is to be given the terrifying gift of agency.',
      },
      {
        tradition: 'bible',
        bookId: 'genesis',
        book: 'Genesis',
        chapter: 2,
        verse: 7,
        text: 'And the Lord God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul.',
        reflection:
          'Two creation accounts, two truths. In the first, humanity is crowned as the climax of cosmic order. In the second, we are clay animated by divine breath — humble and holy at once.',
      },
      {
        tradition: 'quran',
        bookId: '55',
        book: 'Ar-Rahman',
        chapter: 55,
        verse: 1,
        text: 'The Beneficent hath made known the Quran. He hath created man. He hath taught him utterance.',
        reflection:
          'The chapter of the Most Merciful repeats one refrain thirty-one times: "Which is it, of the favours of your Lord, that ye deny?" Creation is not past tense — it is the ongoing generosity of the present moment.',
      },
    ],
  },
  {
    id: 'compassion',
    name: 'The Heart of Compassion',
    subtitle: 'Love your neighbor, the stranger, and even your enemy',
    description:
      'Compassion is the universal language of the sacred. This week explores how each tradition defines, commands, and embodies love — from the Torah\'s command to love the stranger to the Buddha\'s boundless metta. What unites them is more powerful than what divides.',
    color: 'bg-terracotta-pale text-terracotta',
    days: [
      {
        tradition: 'bible',
        bookId: 'matthew',
        book: 'Matthew',
        chapter: 5,
        verse: 44,
        text: 'But I say unto you, Love your enemies, bless them that curse you, do good to them that hate you, and pray for them which despitefully use you, and persecute you.',
        reflection:
          'This is arguably the most radical teaching in religious history. Not tolerance — love. Not avoidance — active blessing. The Greek word is agape: a love that costs something.',
      },
      {
        tradition: 'quran',
        bookId: '4',
        book: 'An-Nisa',
        chapter: 4,
        verse: 36,
        text: 'And serve Allah. Ascribe nothing as partner unto Him. (Show) kindness unto parents, and unto near kindred, and orphans, and the needy, and unto the neighbour who is of kin (unto you) and the neighbour who is not of kin, and the fellow-traveller and the wayfarer and (the slaves) whom your right hands possess.',
        reflection:
          'The Quran expands the circle of compassion in concentric rings: family, neighbor, stranger, traveler, even those bound in servitude. No human category falls outside the command of kindness.',
      },
      {
        tradition: 'buddhist',
        bookId: 'dhammapada',
        book: 'The Dhammapada',
        chapter: 5,
        verse: 50,
        text: 'Let a man overcome anger by love, let him overcome evil by good; let him overcome the greedy by liberality, the liar by truth!',
        reflection:
          'The Buddha offers a physics of compassion: every negative force has a positive counterforce. Anger is not suppressed but dissolved — like salt in water — by the greater volume of love.',
      },
      {
        tradition: 'tanakh',
        bookId: 'leviticus',
        book: 'Leviticus',
        chapter: 19,
        verse: 18,
        text: 'Thou shalt not avenge, nor bear any grudge against the children of thy people, but thou shalt love thy neighbour as thyself: I am the Lord.',
        reflection:
          'The Hebrew "love your neighbor as yourself" (ve-ahavta le-reacha kamocha) is not a feeling but a legal standard. Rabbi Akiva called it the greatest principle of the Torah.',
      },
      {
        tradition: 'mormon',
        bookId: 'mosiah',
        book: 'Mosiah',
        chapter: 2,
        verse: 17,
        text: 'And behold, I tell you these things that ye may learn wisdom; that ye may learn that when ye are in the service of your fellow beings ye are only in the service of your God.',
        reflection:
          'Service is not a detour from spirituality — it is its very definition. To lift another is to lift the divine image they carry. There is no worship that bypasses the neighbor.',
      },
      {
        tradition: 'bible',
        bookId: 'luke',
        book: 'Luke',
        chapter: 10,
        verse: 33,
        text: 'But a certain Samaritan, as he journeyed, came where he was: and when he saw him, he had compassion on him.',
        reflection:
          'The Good Samaritan was the hated outsider — the one the wounded man would have crossed the street to avoid. Compassion does not ask about merit or membership. It kneels beside blood.',
      },
      {
        tradition: 'quran',
        bookId: '2',
        book: 'Al-Baqarah',
        chapter: 2,
        verse: 195,
        text: 'Spend of your good things and render not evil for evil. Do good. Lo! Allah loveth the beneficent.',
        reflection:
          'The Arabic ihsan — often translated "goodness" or "excellence" — implies doing beautiful things beautifully. It is the highest station of faith: to worship as if you see God, and if you do not see Him, to know that He sees you.',
      },
    ],
  },
  {
    id: 'justice',
    name: 'Justice & the Common Good',
    subtitle: 'The sacred demand for fairness',
    description:
      'From the prophets of Israel to the equitable scales of the Quran, justice is not an abstract ideal — it is a divine imperative. This week walks through the texts that shook thrones, freed slaves, and declared that the measure of a society is how it treats its weakest members.',
    color: 'bg-sage-pale text-sage-dark',
    days: [
      {
        tradition: 'tanakh',
        bookId: 'amos',
        book: 'Amos',
        chapter: 5,
        verse: 24,
        text: 'But let judgment run down as waters, and righteousness as a mighty stream.',
        reflection:
          'The prophet Amos was a shepherd, not a priest. He spoke outside the temple, in the marketplace. Justice is not a ritual performed in sanctuary — it is a flood that sweeps through the streets.',
      },
      {
        tradition: 'quran',
        bookId: '4',
        book: 'An-Nisa',
        chapter: 4,
        verse: 135,
        text: 'O ye who believe! Be ye staunch in justice, witnesses for Allah, even though it be against yourselves or (your) parents or (your) kindred, whether (the case be of) a rich man or a poor man, for Allah is nearer unto both (than ye are). So follow not passion lest ye lapse (from truth)...',
        reflection:
          'Justice is higher than loyalty. Even against yourself, even against your own family — the scale must balance. This is one of the most demanding ethical commands in any scripture.',
      },
      {
        tradition: 'bible',
        bookId: 'micah',
        book: 'Micah',
        chapter: 6,
        verse: 8,
        text: 'He hath shewed thee, O man, what is good; and what doth the Lord require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?',
        reflection:
          'Three things, and they are all relational: justice toward others, mercy in your heart, humility before the divine. No burnt offering, no pilgrimage, no elaborate ritual — just this tripod of integrity.',
      },
      {
        tradition: 'buddhist',
        bookId: 'dhammapada',
        book: 'The Dhammapada',
        chapter: 19,
        verse: 258,
        text: 'He is not therefore an Ariya because he injures living beings; he is therefore an Ariya because he does not injure living beings.',
        reflection:
          'The Buddha redefines nobility. It is not birth, rank, or ritual purity — it is the refusal to harm. Justice begins with the simplest act: doing no violence to any living thing.',
      },
      {
        tradition: 'mormon',
        bookId: 'alma',
        book: 'Alma',
        chapter: 5,
        verse: 16,
        text: 'I say unto you, can you imagine to yourselves that ye hear the voice of the Lord, saying unto you, in that day: Come unto me ye blessed, for behold, your works have been the works of righteousness upon the face of the earth?',
        reflection:
          'The final judgment is not a test of theology but a review of action. What did you do? How did you treat others? The question echoes across every tradition: did your life bend toward justice?',
      },
      {
        tradition: 'tanakh',
        bookId: 'isaiah',
        book: 'Isaiah',
        chapter: 1,
        verse: 17,
        text: 'Learn to do well; seek judgment, relieve the oppressed, judge the fatherless, plead for the widow.',
        reflection:
          'The orphan and the widow were the most vulnerable in ancient society — no property, no protection, no voice. The prophetic vision of justice always begins with those the world forgets.',
      },
      {
        tradition: 'bible',
        bookId: 'james',
        book: 'James',
        chapter: 2,
        verse: 17,
        text: 'Even so faith, if it hath not works, is dead, being alone.',
        reflection:
          'Faith without justice is corpse-like — it has the form but not the breath. The Greek word for "works" here is erga: deeds, labor, the sweat of showing up for others.',
      },
    ],
  },
  {
    id: 'forgiveness',
    name: 'The Path of Forgiveness',
    subtitle: 'Letting go, being let go',
    description:
      'Forgiveness is perhaps the hardest spiritual discipline — and the most transformative. This week gathers the voices that call us to release resentment, to receive mercy, and to discover that the one who forgives is often the one who is freed.',
    color: 'bg-wheat-pale text-wheat-dark',
    days: [
      {
        tradition: 'bible',
        bookId: 'matthew',
        book: 'Matthew',
        chapter: 18,
        verse: 21,
        text: 'Then came Peter to him, and said, Lord, how oft shall my brother sin against me, and I forgive him? till seven times? Jesus saith unto him, I say not unto thee, Until seven times: but, Until seventy times seven.',
        reflection:
          'Peter thought he was being generous with seven. Jesus multiplies into infinity. Forgiveness is not a transaction — it is a way of being in the world, a continuous posture of the heart.',
      },
      {
        tradition: 'quran',
        bookId: '39',
        book: 'Az-Zumar',
        chapter: 39,
        verse: 53,
        text: 'Say: O My slaves who have been prodigal to their own hurt! Despair not of the mercy of Allah, Who forgiveth all sins. Lo! He is the Forgiving, the Merciful.',
        reflection:
          'The Quran calls God by two names more than any other: Al-Ghaffar (the repeatedly Forgiving) and Ar-Rahman (the Boundlessly Merciful). No sin exhausts divine forgiveness. No failure is final.',
      },
      {
        tradition: 'buddhist',
        bookId: 'dhammapada',
        book: 'The Dhammapada',
        chapter: 1,
        verse: 5,
        text: 'For hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule.',
        reflection:
          'The Buddha states this as a law of nature, not a moral preference. Hatred breeds hatred with the certainty of gravity. Only love interrupts the chain. Forgiveness is not weakness — it is the only strategy that works.',
      },
      {
        tradition: 'mormon',
        bookId: 'moroni',
        book: 'Moroni',
        chapter: 8,
        verse: 26,
        text: 'And the remission of sins bringeth meekness, and lowliness of heart; and because of meekness and lowliness of heart cometh the visitation of the Holy Ghost, which Comforter filleth with hope and perfect love.',
        reflection:
          'Forgiveness is not merely the erasure of guilt — it is the gateway to transformation. The forgiven heart becomes meek, and the meek heart becomes a vessel for love.',
      },
      {
        tradition: 'tanakh',
        bookId: 'psalms',
        book: 'Psalms',
        chapter: 103,
        verse: 12,
        text: 'As far as the east is from the west, so far hath he removed our transgressions from us.',
        reflection:
          'Not north from south — those have endpoints. East and west never meet. This is infinite distance, infinite removal. The Hebrew imagery is geographical but the theology is astronomical.',
      },
      {
        tradition: 'bible',
        bookId: 'luke',
        book: 'Luke',
        chapter: 23,
        verse: 34,
        text: 'Then said Jesus, Father, forgive them; for they know not what they do.',
        reflection:
          'Forgiveness at the moment of greatest violence — nails through flesh, mockery in the air. This is not a theoretical teaching but a bodily demonstration. The victim prays for the perpetrators.',
      },
      {
        tradition: 'quran',
        bookId: '42',
        book: 'Ash-Shura',
        chapter: 42,
        verse: 40,
        text: 'The guerdon of an ill-deed is an ill the like thereof. But whosoever pardoneth and amendeth, his wage is the affair of Allah. Lo! He loveth not wrong-doers.',
        reflection:
          'Retaliation is permitted — but pardon is elevated. The one who forgives and reforms is rewarded by Allah directly. Forgiveness is not the absence of justice; it is justice transfigured by grace.',
      },
    ],
  },
]

export function getCurrentWeekTheme(): WeeklyTheme {
  const weekIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)) % weeklyThemes.length
  return weeklyThemes[weekIndex]
}

export function getDayOfWeek(): number {
  // Return 0-6 where 0 = Sunday
  return new Date().getDay()
}
