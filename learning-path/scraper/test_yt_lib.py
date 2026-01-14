from youtubesearchpython import PlaylistsSearch

topic = "javascript"
playlistsSearch = PlaylistsSearch(f'{topic} course', limit = 5)

print(playlistsSearch.result())
