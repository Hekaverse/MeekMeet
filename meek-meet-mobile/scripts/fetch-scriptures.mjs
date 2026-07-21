#!/usr/bin/env node
/**
 * Fetch public domain scripture texts and save as JSON.
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_DIR = join(__dirname, '..', 'public', 'data', 'scriptures');

async function saveJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  Saved ${path.replace(BASE_DIR, '')}`);
}

async function fetchJson(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'MeekMeet-App/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) return null;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return null;
}

async function fetchAll(urls, concurrency = 20) {
  const results = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(u => fetchJson(u)));
    results.push(...batchResults);
  }
  return results;
}

// ======================= BIBLE (KJV) =======================
async function fetchBibleKjv() {
  console.log('\n[ Bible - KJV ]');
  const books = [
    ['gen', 'Genesis', 50], ['exo', 'Exodus', 40], ['lev', 'Leviticus', 27], ['num', 'Numbers', 36], ['deu', 'Deuteronomy', 34],
    ['psa', 'Psalms', 150], ['pro', 'Proverbs', 31], ['ecc', 'Ecclesiastes', 12], ['isa', 'Isaiah', 66],
    ['mat', 'Matthew', 28], ['mrk', 'Mark', 16], ['luk', 'Luke', 24], ['jhn', 'John', 21],
    ['rom', 'Romans', 16], ['1co', '1 Corinthians', 16], ['php', 'Philippians', 4],
    ['jas', 'James', 5], ['1jn', '1 John', 5], ['rev', 'Revelation', 22],
  ];

  for (const [abbr, name, chapters] of books) {
    console.log(`  Fetching ${name} (${chapters} chapters)...`);
    const urls = [];
    for (let ch = 1; ch <= chapters; ch++) {
      urls.push(`https://bible-api.com/data/kjv/${abbr}/${ch}`);
    }
    const results = await fetchAll(urls, 25);
    const chapterData = {};
    for (let i = 0; i < results.length; i++) {
      const data = results[i];
      if (data && data.verses) {
        chapterData[String(i + 1)] = data.verses.map(v => v.text.trim());
      } else {
        chapterData[String(i + 1)] = [`[${name} ${i + 1}]`];
      }
    }
    await saveJson(join(BASE_DIR, 'bible', 'kjv', `${name.toLowerCase().replace(/\s+/g, '_')}.json`), {
      book: name, abbreviation: abbr.toUpperCase(), chapters: chapterData
    });
  }
}

// ======================= QURAN (Pickthall) =======================
async function fetchQuranPickthall() {
  console.log('\n[ Quran - Pickthall ]');
  const urls = [];
  for (let surah = 1; surah <= 114; surah++) {
    urls.push(`https://api.alquran.cloud/v1/surah/${surah}/en.pickthall`);
  }
  const results = await fetchAll(urls, 15);
  for (let i = 0; i < results.length; i++) {
    const data = results[i];
    const surah = i + 1;
    if (data && data.data) {
      await saveJson(join(BASE_DIR, 'quran', 'pickthall', `${surah}.json`), {
        surah,
        name: data.data.englishName,
        verses: data.data.ayahs.map(v => ({ num: v.numberInSurah, text: v.text })),
      });
    } else {
      console.log(`    WARN: Surah ${surah} failed`);
    }
  }
}

// ======================= TANAKH (KJV fallback for public domain) =======================
async function fetchTanakhJps() {
  console.log('\n[ Tanakh ]');
  const books = [
    ['gen', 'Genesis', 50], ['exo', 'Exodus', 40], ['lev', 'Leviticus', 27], ['num', 'Numbers', 36], ['deu', 'Deuteronomy', 34],
    ['jos', 'Joshua', 24], ['jdg', 'Judges', 21], ['rut', 'Ruth', 4], ['1sa', '1 Samuel', 31], ['2sa', '2 Samuel', 24],
    ['1ki', '1 Kings', 22], ['2ki', '2 Kings', 25], ['1ch', '1 Chronicles', 29], ['2ch', '2 Chronicles', 36],
    ['ezr', 'Ezra', 10], ['neh', 'Nehemiah', 13], ['est', 'Esther', 10],
    ['job', 'Job', 42], ['psa', 'Psalms', 150], ['pro', 'Proverbs', 31], ['ecc', 'Ecclesiastes', 12],
    ['sos', 'Song of Songs', 8], ['isa', 'Isaiah', 66], ['jer', 'Jeremiah', 52], ['lam', 'Lamentations', 5],
    ['eze', 'Ezekiel', 48], ['dan', 'Daniel', 12],
  ];

  for (const [abbr, name, chapters] of books) {
    console.log(`  Fetching ${name} (${chapters} chapters)...`);
    const urls = [];
    for (let ch = 1; ch <= chapters; ch++) {
      urls.push(`https://bible-api.com/data/kjv/${abbr}/${ch}`);
    }
    const results = await fetchAll(urls, 25);
    const chapterData = {};
    for (let i = 0; i < results.length; i++) {
      const data = results[i];
      if (data && data.verses) {
        chapterData[String(i + 1)] = data.verses.map(v => v.text.trim());
      } else {
        chapterData[String(i + 1)] = [`[${name} ${i + 1}]`];
      }
    }
    await saveJson(join(BASE_DIR, 'tanakh', 'kjv', `${name.toLowerCase().replace(/\s+/g, '_')}.json`), {
      book: name, abbreviation: abbr.toUpperCase(), chapters: chapterData
    });
  }
}

// ======================= DHAMMAPADA =======================
async function fetchDhammapada() {
  console.log('\n[ Dhammapada ]');
  const chapters = {
    "1": { title: "The Twin-Verses", verses: [
      { num: 1, text: "All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts." },
      { num: 2, text: "If a man speaks or acts with an evil thought, pain follows him, as the wheel follows the foot of the ox that draws the carriage." },
      { num: 3, text: "If a man speaks or acts with a pure thought, happiness follows him, like a shadow that never leaves him." },
      { num: 5, text: "For hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule." },
    ]},
    "2": { title: "On Earnestness", verses: [
      { num: 21, text: "Earnestness is the path of immortality (Nirvana), thoughtlessness the path of death." },
      { num: 23, text: "Let the wise man, leaving the way of darkness, follow the light." },
      { num: 27, text: "The foolish man does not care for the company of the wise, but he takes delight in the company of fools." },
    ]},
    "3": { title: "The Mind", verses: [
      { num: 33, text: "The mind is wavering and restless, difficult to guard and restrain: let the wise man straighten his mind as a maker of arrows makes his arrows straight." },
      { num: 35, text: "A wise man should control his mind, for it is hard to guard, it flies away as it likes: a subdued mind brings happiness." },
    ]},
    "4": { title: "Flowers", verses: [
      { num: 44, text: "Who shall overcome this earth, and the world of Yama (the lord of the dead), and the world of the gods? Who shall find out the clearly shown path of virtue, as a clever man finds out the right flower?" },
      { num: 49, text: "As a bee collects nectar and departs without injuring the flower, or its colour or scent, so let a sage dwell in his village." },
    ]},
    "5": { title: "The Fool", verses: [
      { num: 60, text: "Long is the night to him who is awake; long is a mile to him who is tired; long is life to the foolish who do not know the true law." },
    ]},
    "6": { title: "The Wise Man", verses: [
      { num: 76, text: "Lead a life of righteousness, and not a life of sin; for the righteous live happily both in this world and the next." },
    ]},
    "7": { title: "The Venerable", verses: [
      { num: 90, text: "There is no suffering for him who has finished his journey, and abandoned grief, who has freed himself on all sides, and thrown off all fetters." },
    ]},
    "8": { title: "The Thousands", verses: [
      { num: 100, text: "Though one may conquer a thousand times a thousand men in battle, yet he indeed is the noblest victor who conquers himself." },
    ]},
    "9": { title: "Evil", verses: [
      { num: 116, text: "Hasten to do good; restrain your mind from evil; for the mind of him who is slow in doing good delights in evil." },
    ]},
    "10": { title: "Punishment", verses: [
      { num: 124, text: "He who seeks his own happiness by hurting others who also want happiness, shall not find happiness hereafter." },
    ]},
    "11": { title: "Old Age", verses: [
      { num: 146, text: "What is laughter, what is joy, when the world is ever burning? Shrouded by darkness, would you not seek a light?" },
    ]},
    "12": { title: "Self", verses: [
      { num: 157, text: "If one knows that this body is frail like a jar, and establishes the mind firm like a fortress, one should attack Mara with the weapon of wisdom, and guard what has been conquered, and remain always awake." },
    ]},
    "13": { title: "The World", verses: [
      { num: 167, text: "Do not follow the evil law! Do not live in thoughtlessness! Do not follow false doctrine!" },
    ]},
    "14": { title: "The Buddha", verses: [
      { num: 183, text: "Not to commit any sin, to do good, and to purify one's mind, that is the teaching of all the Awakened." },
    ]},
    "15": { title: "Happiness", verses: [
      { num: 197, text: "Let us live happily then, not hating those who hate us! Among men who hate us, let us dwell free from hatred!" },
    ]},
    "16": { title: "Pleasure", verses: [
      { num: 209, text: "He who gives himself to vanity, and does not give himself to meditation, forgetting the real aim of life and grasping at pleasure, will in time envy him who has exerted himself in meditation." },
    ]},
    "17": { title: "Anger", verses: [
      { num: 221, text: "Let a man leave anger, let him forsake pride, let him overcome all fetters! Sufferings befall the foolish man who is overcome by pride." },
    ]},
    "18": { title: "Impurities", verses: [
      { num: 236, text: "Make an island of yourself, make yourself your refuge; there is no other refuge. Make truth your island, make truth your refuge; there is no other refuge." },
    ]},
    "19": { title: "The Just", verses: [
      { num: 256, text: "He is not just if he decides a case arbitrarily; the wise man should decide after considering both what is right and what is wrong." },
    ]},
    "20": { title: "The Way", verses: [
      { num: 273, text: "The best of ways is the eightfold way; the best of truths the four words; the best of virtues passionlessness; the best of men he who has eyes to see." },
    ]},
    "21": { title: "Miscellaneous", verses: [
      { num: 290, text: "If by leaving a small pleasure one sees a great pleasure, let a wise man leave the small pleasure, and look to the great." },
    ]},
    "22": { title: "The Downward Course", verses: [
      { num: 306, text: "He who says what is not, goes to hell; he also who, having done a thing, says I have not done it. After death both are equal, they are men with evil deeds in the next world." },
    ]},
    "23": { title: "The Elephant", verses: [
      { num: 320, text: "As an elephant in the battlefield endures the arrow shot from a bow, so shall I endure abuse; for many people are ill-behaved." },
    ]},
    "24": { title: "Thirst", verses: [
      { num: 334, text: "The thirst of a thoughtless man grows like a creeper; he runs from life to life, like a monkey looking for fruit in the forest." },
    ]},
    "25": { title: "The Bhikshu", verses: [
      { num: 360, text: "Good is restraint of the eye; good is restraint of the ear; good is restraint of the nose; good is restraint of the tongue." },
    ]},
    "26": { title: "The Brahmana", verses: [
      { num: 383, text: "Stop the stream valiantly, drive away the desires, O Brahmana! When you have understood the destruction of all that was made, you will understand that which was not made." },
    ]},
  };
  await saveJson(join(BASE_DIR, 'buddhist', 'dhammapada.json'), { book: "The Dhammapada", chapters });
}

// ======================= MAIN =======================
console.log("=".repeat(60));
console.log("Meek Meet Scripture Fetcher");
console.log("=".repeat(60));

await fetchBibleKjv();
await fetchQuranPickthall();
await fetchTanakhJps();
await fetchDhammapada();

console.log("\n[Done] Scripture files saved to public/data/scriptures/");
