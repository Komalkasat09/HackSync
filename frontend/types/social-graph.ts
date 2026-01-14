export type GraphNodeType = "post" | "comment" | "user"

export interface GraphQueryMeta {
  keyword: string
  start_date: string
  end_date: string
  time_range: string
  post_count: number
  comment_count: number
  user_count: number
}

export interface GraphSummary {
  subreddit_counts: Record<string, number>
  top_users: string[]
}

export interface RedditGraphPost {
  id: string
  title: string
  author: string
  score: number
  num_comments: number
  created_utc: string
  permalink: string
  subreddit: string
  url?: string | null
}

export interface RedditGraphComment {
  id: string
  body: string
  author: string
  score: number
  created_utc: string
  post_id: string
  parent_id?: string | null
}

export interface RedditGraphUser {
  username: string
  post_count: number
  comment_count: number
  karma?: number | null
}

export interface RedditGraphEdge {
  id: string
  edge_type: "authored" | "commented" | "thread" | "reply"
  from: string
  to: string
}

export interface RedditSocialGraphResponse {
  graph_id?: number
  query: GraphQueryMeta
  summary: GraphSummary
  posts: RedditGraphPost[]
  comments: RedditGraphComment[]
  users: RedditGraphUser[]
  edges: RedditGraphEdge[]
}

export interface SelectedGraphNode {
  type: GraphNodeType
  payload: RedditGraphPost | RedditGraphComment | RedditGraphUser
}

export interface GraphHistoryItem {
  graph_id: number
  keyword: string
  time_range: string
  created_at: string
}


