#!/usr/bin/env python3
"""
⚠️  WARNING: THIS SCRIPT IS OUTDATED AND SHOULD NOT BE RUN  ⚠️

This script was used for initial data population but is now dangerously
out of sync with the actual scripture data. Running it would overwrite
complete texts with incomplete data and placeholders.

Current data status (DO NOT OVERWRITE):
- Bible: All 66 books with full KJV verse text
- Tanakh: All 27 books with full text
- Quran: All 114 surahs with Pickthall translation
- Dhammapada: All 26 chapters, 413 verses with Müller translation

If you need to re-populate data, update this script first or use
fetch-scriptures.mjs instead.
"""

import json
import os
import time
import urllib.request
import urllib.error

BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data", "scriptures")


def fetch_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "MeekMeet-App/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"  Retry {attempt + 1}/{retries}: {e}")
            time.sleep(1)
    return None


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved {path}")


# ======================= BIBLE (KJV) =======================
def fetch_bible_kjv():
    print("\n📖 Fetching Bible (KJV)...")
    books = [
        ("Genesis", "GEN", 50),
        ("Exodus", "EXO", 40),
        ("Leviticus", "LEV", 27),
        ("Numbers", "NUM", 36),
        ("Deuteronomy", "DEU", 34),
        ("Psalms", "PSA", 150),
        ("Proverbs", "PRO", 31),
        ("Ecclesiastes", "ECC", 12),
        ("Isaiah", "ISA", 66),
        ("Matthew", "MAT", 28),
        ("Mark", "MRK", 16),
        ("Luke", "LUK", 24),
        ("John", "JHN", 21),
        ("Romans", "ROM", 16),
        ("1 Corinthians", "1CO", 16),
        ("Philippians", "PHP", 4),
        ("James", "JAS", 5),
        ("1 John", "1JN", 5),
        ("Revelation", "REV", 22),
    ]

    for book_name, book_abbr, chapters in books:
        safe_name = book_name.lower().replace(" ", "_")
        out_path = os.path.join(BASE_DIR, "bible", "kjv", f"{safe_name}.json")
        if os.path.exists(out_path):
            print(f"  Skip {book_name} (exists)")
            continue

        print(f"  Fetching {book_name} ({chapters} chapters)...")
        chapter_data = {}
        for ch in range(1, chapters + 1):
            url = f"https://bible-api.com/{book_name}+{ch}?translation=kjv"
            data = fetch_json(url)
            if data and "verses" in data:
                verses = [v["text"].strip() for v in data["verses"]]
                chapter_data[str(ch)] = verses
            else:
                chapter_data[str(ch)] = [f"[{book_name} {ch}]"]
            time.sleep(0.15)

        save_json(out_path, {
            "book": book_name,
            "abbreviation": book_abbr,
            "chapters": chapter_data
        })


# ======================= QURAN (Pickthall) =======================
def fetch_quran_pickthall():
    print("\n☪️  Fetching Quran (Pickthall)...")
    out_dir = os.path.join(BASE_DIR, "quran", "pickthall")

    # Fetch all 114 surahs
    for surah_num in range(1, 115):
        out_path = os.path.join(out_dir, f"{surah_num}.json")
        if os.path.exists(out_path):
            print(f"  Skip Surah {surah_num} (exists)")
            continue

        url = f"https://api.alquran.cloud/v1/surah/{surah_num}/en.pickthall"
        data = fetch_json(url)
        if data and data.get("data"):
            verses = [
                {"num": v["numberInSurah"], "text": v["text"]}
                for v in data["data"]["ayahs"]
            ]
            save_json(out_path, {
                "surah": surah_num,
                "name": data["data"]["englishName"],
                "verses": verses
            })
        else:
            print(f"  Failed Surah {surah_num}")
        time.sleep(0.15)


# ======================= TANAKH (JPS 1917) =======================
def fetch_tanakh_jps():
    print("\n✡️  Fetching Tanakh (JPS 1917)...")
    books = [
        ("Genesis", 50), ("Exodus", 40), ("Leviticus", 27),
        ("Numbers", 36), ("Deuteronomy", 34), ("Joshua", 24),
        ("Judges", 21), ("Ruth", 4), ("1 Samuel", 31),
        ("2 Samuel", 24), ("1 Kings", 22), ("2 Kings", 25),
        ("Isaiah", 66), ("Jeremiah", 52), ("Ezekiel", 48),
        ("Psalms", 150), ("Proverbs", 31), ("Job", 42),
        ("Song of Songs", 8), ("Ecclesiastes", 12),
        ("Lamentations", 5), ("Esther", 10), ("Daniel", 12),
        ("Ezra", 10), ("Nehemiah", 13), ("1 Chronicles", 29), ("2 Chronicles", 36),
    ]

    for book_name, chapters in books:
        safe_name = book_name.lower().replace(" ", "_")
        out_path = os.path.join(BASE_DIR, "tanakh", "jps1917", f"{safe_name}.json")
        if os.path.exists(out_path):
            print(f"  Skip {book_name} (exists)")
            continue

        print(f"  Fetching {book_name} ({chapters} chapters)...")
        chapter_data = {}
        for ch in range(1, chapters + 1):
            url = f"https://bible-api.com/{book_name}+{ch}?translation=kjv"
            data = fetch_json(url)
            if data and "verses" in data:
                verses = [v["text"].strip() for v in data["verses"]]
                chapter_data[str(ch)] = verses
            else:
                chapter_data[str(ch)] = [f"[{book_name} {ch}]"]
            time.sleep(0.15)

        save_json(out_path, {
            "book": book_name,
            "chapters": chapter_data
        })


# ======================= DHAMMAPADA =======================
def fetch_dhammapada():
    print("\n[ Dhammapada ]")
    out_path = os.path.join(BASE_DIR, "buddhist", "dhammapada.json")
    if os.path.exists(out_path):
        print("  Skip Dhammapada (exists)")
        return

    # Dhammapada is short enough to embed from public domain source
    chapters = {
        "1": {"title": "The Twin-Verses", "verses": [
            {"num": 1, "text": "All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts."},
            {"num": 2, "text": "If a man speaks or acts with an evil thought, pain follows him, as the wheel follows the foot of the ox that draws the carriage."},
            {"num": 3, "text": "If a man speaks or acts with a pure thought, happiness follows him, like a shadow that never leaves him."},
            {"num": 5, "text": "For hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule."},
        ]},
        "2": {"title": "On Earnestness", "verses": [
            {"num": 21, "text": "Earnestness is the path of immortality (Nirvana), thoughtlessness the path of death."},
            {"num": 23, "text": "Let the wise man, leaving the way of darkness, follow the light."},
            {"num": 27, "text": "The foolish man does not care for the company of the wise, but he takes delight in the company of fools."},
        ]},
        "3": {"title": "The Mind", "verses": [
            {"num": 33, "text": "The mind is wavering and restless, difficult to guard and restrain: let the wise man straighten his mind as a maker of arrows makes his arrows straight."},
            {"num": 35, "text": "A wise man should control his mind, for it is hard to guard, it flies away as it likes: a subdued mind brings happiness."},
        ]},
        "4": {"title": "Flowers", "verses": [
            {"num": 44, "text": "Who shall overcome this earth, and the world of Yama (the lord of the dead), and the world of the gods? Who shall find out the clearly shown path of virtue, as a clever man finds out the right flower?"},
            {"num": 49, "text": "As a bee collects nectar and departs without injuring the flower, or its colour or scent, so let a sage dwell in his village."},
        ]},
        "5": {"title": "The Fool", "verses": [
            {"num": 60, "text": "Long is the night to him who is awake; long is a mile to him who is tired; long is life to the foolish who do not know the true law."},
        ]},
        "6": {"title": "The Wise Man", "verses": [
            {"num": 76, "text": "Lead a life of righteousness, and not a life of sin; for the righteous live happily both in this world and the next."},
        ]},
        "7": {"title": "The Venerable", "verses": [
            {"num": 90, "text": "There is no suffering for him who has finished his journey, and abandoned grief, who has freed himself on all sides, and thrown off all fetters."},
        ]},
        "8": {"title": "The Thousands", "verses": [
            {"num": 100, "text": "Though one may conquer a thousand times a thousand men in battle, yet he indeed is the noblest victor who conquers himself."},
        ]},
        "9": {"title": "Evil", "verses": [
            {"num": 116, "text": "Hasten to do good; restrain your mind from evil; for the mind of him who is slow in doing good delights in evil."},
        ]},
        "10": {"title": "Punishment", "verses": [
            {"num": 124, "text": "He who seeks his own happiness by hurting others who also want happiness, shall not find happiness hereafter."},
        ]},
        "11": {"title": "Old Age", "verses": [
            {"num": 146, "text": "What is laughter, what is joy, when the world is ever burning? Shrouded by darkness, would you not seek a light?"},
        ]},
        "12": {"title": "Self", "verses": [
            {"num": 157, "text": "If one knows that this body is frail like a jar, and establishes the mind firm like a fortress, one should attack Mara with the weapon of wisdom, and guard what has been conquered, and remain always awake."},
        ]},
        "13": {"title": "The World", "verses": [
            {"num": 167, "text": "Do not follow the evil law! Do not live in thoughtlessness! Do not follow false doctrine!"},
        ]},
        "14": {"title": "The Buddha", "verses": [
            {"num": 183, "text": "Not to commit any sin, to do good, and to purify one's mind, that is the teaching of all the Awakened."},
        ]},
        "15": {"title": "Happiness", "verses": [
            {"num": 197, "text": "Let us live happily then, not hating those who hate us! Among men who hate us, let us dwell free from hatred!"},
        ]},
        "16": {"title": "Pleasure", "verses": [
            {"num": 209, "text": "He who gives himself to vanity, and does not give himself to meditation, forgetting the real aim of life and grasping at pleasure, will in time envy him who has exerted himself in meditation."},
        ]},
        "17": {"title": "Anger", "verses": [
            {"num": 221, "text": "Let a man leave anger, let him forsake pride, let him overcome all fetters! Sufferings befall the foolish man who is overcome by pride."},
        ]},
        "18": {"title": "Impurities", "verses": [
            {"num": 236, "text": "Make an island of yourself, make yourself your refuge; there is no other refuge. Make truth your island, make truth your refuge; there is no other refuge."},
        ]},
        "19": {"title": "The Just", "verses": [
            {"num": 256, "text": "He is not just if he decides a case arbitrarily; the wise man should decide after considering both what is right and what is wrong."},
        ]},
        "20": {"title": "The Way", "verses": [
            {"num": 273, "text": "The best of ways is the eightfold way; the best of truths the four words; the best of virtues passionlessness; the best of men he who has eyes to see."},
        ]},
        "21": {"title": "Miscellaneous", "verses": [
            {"num": 290, "text": "If by leaving a small pleasure one sees a great pleasure, let a wise man leave the small pleasure, and look to the great."},
        ]},
        "22": {"title": "The Downward Course", "verses": [
            {"num": 306, "text": "He who says what is not, goes to hell; he also who, having done a thing, says I have not done it. After death both are equal, they are men with evil deeds in the next world."},
        ]},
        "23": {"title": "The Elephant", "verses": [
            {"num": 320, "text": "As an elephant in the battlefield endures the arrow shot from a bow, so shall I endure abuse; for many people are ill-behaved."},
        ]},
        "24": {"title": "Thirst", "verses": [
            {"num": 334, "text": "The thirst of a thoughtless man grows like a creeper; he runs from life to life, like a monkey looking for fruit in the forest."},
        ]},
        "25": {"title": "The Bhikshu", "verses": [
            {"num": 360, "text": "Good is restraint of the eye; good is restraint of the ear; good is restraint of the nose; good is restraint of the tongue."},
        ]},
        "26": {"title": "The Brahmana", "verses": [
            {"num": 383, "text": "Stop the stream valiantly, drive away the desires, O Brahmana! When you have understood the destruction of all that was made, you will understand that which was not made."},
        ]},
    }
    save_json(out_path, {"book": "The Dhammapada", "chapters": chapters})


if __name__ == "__main__":
    print("=" * 60)
    print("Meek Meet Scripture Fetcher")
    print("Fetching public domain texts from free APIs...")
    print("=" * 60)
    import sys
    sys.stdout.reconfigure(encoding='utf-8')

    fetch_bible_kjv()
    fetch_quran_pickthall()
    fetch_tanakh_jps()
    fetch_dhammapada()

    print("\n[Done] Scripture files saved to public/data/scriptures/")
