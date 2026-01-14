import logging
import time
from duckduckgo_search import DDGS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('YT_DEBUG')

topic = "python"
# Removed site: operator to see if it makes a difference
queries = [
    f"{topic} youtube complete course",
    f"best {topic} tutorials youtube"
]

resources = []
try:
    with DDGS() as ddgs:
        for query in queries:
            logger.info(f"Querying: {query}")
            results = list(ddgs.text(query, max_results=10))
            logger.info(f"Got {len(results)} results")
            for r in results:
                logger.info(f"Link: {r['href']}")
                if 'youtube.com/watch' in r['href'] or 'youtube.com/playlist' in r['href']:
                    logger.info("MATCH!")
                    resources.append(r['href'])
except Exception as e:
    logger.error(f"FAIL: {e}")

print(f"Final Count: {len(resources)}")
