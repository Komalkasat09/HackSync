from youtubesearchpython import VideosSearch
import json

topic = "python"
videos_search = VideosSearch(f"best {topic} course", limit=5)
result = videos_search.result()

print(json.dumps(result, indent=2))
