const NEWS_SOURCES = [
  // Startup & VC news
  { url: 'https://techcrunch.com/category/venture/feed/', category: 'startups', name: 'TechCrunch Venture' },
  { url: 'https://techcrunch.com/category/startups/feed/', category: 'startups', name: 'TechCrunch Startups' },
  { url: 'https://venturebeat.com/category/entrepreneur/feed/', category: 'startups', name: 'VentureBeat' },
  { url: 'https://news.crunchbase.com/feed/', category: 'startups', name: 'Crunchbase News' },
  { url: 'https://www.entrepreneur.com/latest.rss', category: 'startups', name: 'Entrepreneur' },
  { url: 'https://feeds.feedburner.com/pitchbook-news-latest-headlines', category: 'startups', name: 'PitchBook' },

  // Company & tech business
  { url: 'https://techcrunch.com/feed/', category: 'technology', name: 'TechCrunch' },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'technology', name: 'The Verge' },
  { url: 'https://www.forbes.com/innovation/feed/', category: 'technology', name: 'Forbes Innovation' },

  // AI & tech companies
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', category: 'ai-robotics', name: 'TechCrunch AI' },
  { url: 'https://venturebeat.com/category/ai/feed/', category: 'ai-robotics', name: 'VB AI' },

  // Fintech companies
  { url: 'https://techcrunch.com/category/fintech/feed/', category: 'finance', name: 'TechCrunch Fintech' },

  // Product launches
  { url: 'https://www.producthunt.com/feed', category: 'technology', name: 'Product Hunt' },
]