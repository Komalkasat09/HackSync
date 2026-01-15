from duckduckgo_search import DDGS
import json

topic = "javascript"
queries = [
    f"{topic} complete course youtube playlist",
    f"best {topic} tutorials playlist youtube"
]

with DDGS() as ddgs:
    for query in queries:
        print(f"Query: {query}")
        results = list(ddgs.text(query, max_results=10))
        for r in results:
            print(f"Title: {r['title']}")
            print(f"URL: {r['href']}")
            print("-" * 20)
        print("=" * 40)
