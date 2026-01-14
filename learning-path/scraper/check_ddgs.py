from duckduckgo_search import DDGS
import logging

logging.basicConfig(level=logging.INFO)
results = list(DDGS().text('javascript course youtube playlist', max_results=5))
print(f"Results: {len(results)}")
for r in results:
    print(r['href'])
