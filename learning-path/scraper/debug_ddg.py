from duckduckgo_search import DDGS

with DDGS() as ddgs:
    results = ddgs.text("javascript tutorials youtube playlist", max_results=5)
    for r in results:
        print(r)
