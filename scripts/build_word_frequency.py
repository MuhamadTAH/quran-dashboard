import urllib.request
import json
import re
from collections import Counter
import os

url = 'https://api.alquran.cloud/v1/quran/quran-uthmani'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
print('Fetching complete Quran Uthmani text...')
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode('utf-8'))['data']

# Waqf symbols and decorative marks in Quran to strip from word boundaries
WAQF_MARKS = r'[\u06D6-\u06DC\u06DE-\u06E8\u06EA-\u06ED\u060E\u060F\u0615\u061B\u061E\u061F\u060C\.\,\;\(\)\[\]\{\}\<\>\"\'«»\:\!\؟]'

def clean_token(w):
    w = re.sub(WAQF_MARKS, '', w)
    w = w.strip()
    return w

word_counts = Counter()
total_tokens = 0

for surah in data['surahs']:
    for ayah in surah['ayahs']:
        words = ayah['text'].split()
        for w in words:
            cw = clean_token(w)
            if cw:
                word_counts[cw] += 1
                total_tokens += 1

print(f'Total tokens in Quran: {total_tokens}')
print(f'Total unique words with exact tashkeel: {len(word_counts)}')

# Let's count how many occur 1 time, 2 times, 3 times
counts_distribution = Counter(word_counts.values())
print(f'Words appearing exactly 1 time (Hapax Legomena): {counts_distribution[1]}')
print(f'Words appearing exactly 2 times: {counts_distribution[2]}')
print(f'Words appearing exactly 3 times: {counts_distribution[3]}')

# Filter dictionary: To keep the bundle size compact and fast,
# We can save a dictionary of all words that appear <= 5 times (or their exact counts),
# Or we can store the counts dictionary.
# Let's see: how many words have count <= 5 vs all words.
rare_words = {word: count for word, count in word_counts.items() if count <= 10}
print(f'Words with count <= 10: {len(rare_words)}')

# Save the frequency map
os.makedirs('src/data', exist_ok=True)
with open('src/data/quranWordFreq.json', 'w', encoding='utf-8') as f:
    json.dump(dict(word_counts), f, ensure_ascii=False)

print('Saved src/data/quranWordFreq.json successfully!')
print('File size:', os.path.getsize('src/data/quranWordFreq.json') / 1024, 'KB')
