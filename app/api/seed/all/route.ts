import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify'

// Service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// SAMPLE USERS
// ============================================================
const sampleUsers = [
  {
    email: 'arjun.patel@dsrt-demo.com',
    full_name: 'Arjun Patel',
    username: 'arjunpatel',
    tagline: 'Building AI agents that actually work',
    bio: 'CS @ IIT Bombay. Previously built two ML startups. Obsessed with agents and reasoning.',
    location: 'Mumbai, India',
    brings: ['builder', 'visionary'],
    seeking: ['cofounder', 'collaborators'],
    interest_topics: ['ai', 'saas', 'devtools'],
    avatar_seed: 'arjun',
  },
  {
    email: 'priya.sharma@dsrt-demo.com',
    full_name: 'Priya Sharma',
    username: 'priyasharma',
    tagline: 'Designing for builders. Ex-Razorpay.',
    bio: 'Product designer. Love working on tools used by other builders. Currently exploring the intersection of design and AI.',
    location: 'Bangalore, India',
    brings: ['builder', 'launcher'],
    seeking: ['projects', 'collaborators'],
    interest_topics: ['saas', 'creator', 'productivity'],
    avatar_seed: 'priya',
  },
  {
    email: 'rohan.mehta@dsrt-demo.com',
    full_name: 'Rohan Mehta',
    username: 'rohanmehta',
    tagline: 'Robotics + Embedded Systems',
    bio: 'Final year @ IIT Kharagpur. Built autonomous drones for last 2 years. Looking to commercialize.',
    location: 'Kharagpur, India',
    brings: ['builder', 'maker'],
    seeking: ['cofounder', 'mentorship'],
    interest_topics: ['robotics', 'iot', 'aerospace'],
    avatar_seed: 'rohan',
  },
  {
    email: 'sneha.iyer@dsrt-demo.com',
    full_name: 'Sneha Iyer',
    username: 'snehaiyer',
    tagline: 'Climate tech researcher → founder',
    bio: 'PhD in environmental engineering. Working on carbon capture for industrial emissions.',
    location: 'Chennai, India',
    brings: ['visionary', 'professional'],
    seeking: ['team', 'investors'],
    interest_topics: ['climate', 'cleantech', 'agritech'],
    avatar_seed: 'sneha',
  },
  {
    email: 'karan.singh@dsrt-demo.com',
    full_name: 'Karan Singh',
    username: 'karansingh',
    tagline: 'Full-stack dev. Shipped 12 side projects.',
    bio: 'Code in TypeScript and Rust. Currently obsessed with local-first software and offline-capable apps.',
    location: 'Delhi, India',
    brings: ['builder'],
    seeking: ['projects', 'ideas'],
    interest_topics: ['devtools', 'saas', 'productivity'],
    avatar_seed: 'karan',
  },
  {
    email: 'meera.krishnan@dsrt-demo.com',
    full_name: 'Meera Krishnan',
    username: 'meerakrishnan',
    tagline: 'HealthTech founder | Building for rural India',
    bio: 'MBBS + MBA. Spent 3 years in rural healthcare. Now building diagnostic tools that work without internet.',
    location: 'Coimbatore, India',
    brings: ['visionary', 'professional'],
    seeking: ['team', 'team members'],
    interest_topics: ['healthtech', 'biotech', 'social'],
    avatar_seed: 'meera',
  },
  {
    email: 'aditya.kumar@dsrt-demo.com',
    full_name: 'Aditya Kumar',
    username: 'adityakumar',
    tagline: 'ML engineer @ research lab',
    bio: 'Working on multimodal models. Open to collaborating on agriculture or healthcare AI projects.',
    location: 'Hyderabad, India',
    brings: ['builder', 'professional'],
    seeking: ['projects'],
    interest_topics: ['ai', 'healthtech', 'agritech'],
    avatar_seed: 'aditya',
  },
  {
    email: 'nisha.gupta@dsrt-demo.com',
    full_name: 'Nisha Gupta',
    username: 'nishagupta',
    tagline: 'Content + community for builders',
    bio: 'Built communities for 3 dev tool companies. I help builders find their audience.',
    location: 'Pune, India',
    brings: ['launcher'],
    seeking: ['projects', 'collaborators'],
    interest_topics: ['creator', 'devtools', 'social'],
    avatar_seed: 'nisha',
  },
  {
    email: 'vikram.rao@dsrt-demo.com',
    full_name: 'Vikram Rao',
    username: 'vikramrao',
    tagline: 'Hardware hacker. Building drones at CGEC.',
    bio: '3rd year EE @ CGEC. Building autonomous agricultural drones with a team of 4.',
    location: 'Cooch Behar, India',
    brings: ['builder', 'maker'],
    seeking: ['mentorship', 'collaborators'],
    interest_topics: ['robotics', 'agritech', 'iot'],
    avatar_seed: 'vikram',
  },
  {
    email: 'tara.menon@dsrt-demo.com',
    full_name: 'Tara Menon',
    username: 'tarameNON',
    tagline: 'EdTech founder. 50k+ students reached.',
    bio: 'Built an interactive STEM learning platform now used in 30 schools. Looking for technical co-founder.',
    location: 'Kochi, India',
    brings: ['visionary', 'launcher'],
    seeking: ['cofounder'],
    interest_topics: ['edtech', 'ai', 'social'],
    avatar_seed: 'tara',
  },
  {
    email: 'arnav.desai@dsrt-demo.com',
    full_name: 'Arnav Desai',
    username: 'arnavdesai',
    tagline: 'Mobile dev → fintech builder',
    bio: 'Built mobile apps used by 2M users at my previous startup. Now exploring fintech for SMBs.',
    location: 'Ahmedabad, India',
    brings: ['builder', 'visionary'],
    seeking: ['cofounder', 'ideas'],
    interest_topics: ['fintech', 'saas', 'productivity'],
    avatar_seed: 'arnav',
  },
  {
    email: 'ananya.banerjee@dsrt-demo.com',
    full_name: 'Ananya Banerjee',
    username: 'ananyabanerjee',
    tagline: 'BioTech researcher @ NIT Durgapur',
    bio: 'Genomics + computational biology. Looking to apply ML to drug discovery.',
    location: 'Durgapur, India',
    brings: ['builder', 'professional'],
    seeking: ['projects', 'mentorship'],
    interest_topics: ['biotech', 'ai', 'healthtech'],
    avatar_seed: 'ananya',
  },
  {
    email: 'kabir.shah@dsrt-demo.com',
    full_name: 'Kabir Shah',
    username: 'kabirshah',
    tagline: 'Designer who codes. SaaS-pilled.',
    bio: 'Currently freelancing for early-stage startups. Always shipping. Always learning.',
    location: 'Mumbai, India',
    brings: ['builder', 'launcher'],
    seeking: ['projects'],
    interest_topics: ['saas', 'creator', 'devtools'],
    avatar_seed: 'kabir',
  },
  {
    email: 'rhea.kapoor@dsrt-demo.com',
    full_name: 'Rhea Kapoor',
    username: 'rheakapoor',
    tagline: 'VC analyst | always looking for builders',
    bio: 'Analyst at Blume Ventures. Love meeting early-stage founders building in deep tech.',
    location: 'Bangalore, India',
    brings: ['professional', 'mentor'],
    seeking: ['ideas', 'feedback'],
    interest_topics: ['ai', 'climate', 'space'],
    avatar_seed: 'rhea',
  },
  {
    email: 'arjun.nair@dsrt-demo.com',
    full_name: 'Arjun Nair',
    username: 'arjunnair',
    tagline: 'Space tech enthusiast, building cubesats',
    bio: 'Aerospace engineer. Currently building a 1U cubesat for atmospheric research with friends.',
    location: 'Trivandrum, India',
    brings: ['builder', 'maker'],
    seeking: ['collaborators', 'team'],
    interest_topics: ['space', 'aerospace', 'iot'],
    avatar_seed: 'arjun-n',
  },
]

// ============================================================
// SAMPLE POSTS
// ============================================================
const samplePosts = [
  {
    type: 'launch',
    content:
      '🚀 After 6 months of building, we just launched DroneNav AI — autonomous flight system for agricultural drones.\n\nUsing computer vision to navigate without GPS. Tested across 200+ hectares.\n\nWould love feedback from the community.',
    tags: ['robotics', 'agritech', 'computervision'],
    user: 'rohanmehta',
  },
  {
    type: 'looking_for',
    content:
      'Looking for a backend engineer (Go or Rust) to join a stealth fintech for SMBs.\n\nWe have early traction with 50 paying customers. Need someone to scale the infra.\n\nEquity + small salary. Remote-first.',
    tags: ['fintech', 'backend', 'hiring'],
    user: 'arnavdesai',
  },
  {
    type: 'build_log',
    content:
      'Shipped v2 of our diagnostic tool today.\n\nKey improvements:\n• Offline-first sync\n• Works on 2G connections\n• 12 new disease detection models\n\nNext: regulatory approval.',
    tags: ['healthtech', 'mobile'],
    user: 'meerakrishnan',
  },
  {
    type: 'milestone',
    content:
      '🎉 Just crossed 50,000 students on our platform.\n\nTwo years ago I was the only user. Now teachers in 30 schools tell us we changed how they teach STEM.\n\nThank you to everyone who tested early versions.',
    tags: ['edtech', 'milestone'],
    user: 'tarameNON',
  },
  {
    type: 'idea',
    content:
      'Idea I cannot stop thinking about:\n\nA local-first note-taking app where everything syncs P2P between your devices. No servers. No subscriptions.\n\nUses CRDTs for conflict resolution. Has anyone tried building this?',
    tags: ['productivity', 'p2p', 'localfirst'],
    user: 'karansingh',
  },
  {
    type: 'discussion',
    content:
      'Honest question for founders here:\n\nWhen building an MVP, how much do you obsess about design vs just shipping ugly?\n\nI ship ugly and iterate. But seeing some beautifully designed early products makes me wonder if I am leaving something on the table.',
    tags: ['startup', 'design', 'discussion'],
    user: 'kabirshah',
  },
  {
    type: 'build_log',
    content:
      'Day 14 of building our cubesat:\n\n✓ Solar panel deployment mechanism working\n✓ Communication module tested\n✗ Battery life is half of what we calculated\n\nDebugging tomorrow. Pic of the prototype below.',
    tags: ['space', 'hardware', 'aerospace'],
    user: 'arjunnair',
  },
  {
    type: 'idea',
    content:
      'What if hospitals in rural India had a shared diagnostic AI that worked offline and improved with every village it served?\n\nThe model gets smarter with local data. Privacy preserved. No internet needed for inference.\n\nThis is what I am building.',
    tags: ['healthtech', 'ai', 'social'],
    user: 'meerakrishnan',
  },
  {
    type: 'looking_for',
    content:
      'Need a co-founder for an EdTech venture.\n\nLooking for: technical founder, ideally with experience building consumer apps.\n\nI bring: distribution (50k+ students), domain expertise, and 2 years of customer interviews.\n\nDM me.',
    tags: ['cofounder', 'edtech'],
    user: 'tarameNON',
  },
  {
    type: 'launch',
    content:
      '🚀 Open sourcing our drone flight controller code today.\n\nGitHub: link in comments.\n\nIf you are building autonomous drones for agriculture, please use it and contribute back. Saved us 6 months of work building this from scratch.',
    tags: ['opensource', 'robotics', 'agritech'],
    user: 'vikramrao',
  },
  {
    type: 'milestone',
    content:
      'First investor cheque cleared today 💸\n\nTook 47 meetings over 4 months to close a $250k pre-seed.\n\nLesson: every "no" taught me something about my pitch. Worth all the rejection.',
    tags: ['fundraising', 'milestone'],
    user: 'arnavdesai',
  },
  {
    type: 'discussion',
    content:
      'Hot take:\n\nMost AI startups in India are wrapping GPT and calling it an MVP.\n\nReal value is in domain-specific data + workflows. The model is the commodity.\n\nThoughts?',
    tags: ['ai', 'opinion', 'startup'],
    user: 'arjunpatel',
  },
  {
    type: 'build_log',
    content:
      'Spent the weekend rewriting our auth system.\n\nOld: Firebase auth (slow, expensive at scale)\nNew: Lucia + Postgres sessions\n\nLoad time dropped 60%. Bill drops ~$400/mo at our current scale.',
    tags: ['backend', 'performance'],
    user: 'karansingh',
  },
  {
    type: 'idea',
    content:
      'Building agentic AI feels like the early days of mobile apps.\n\nEveryone is figuring out the patterns. The frameworks are not stable. Most demos are fake.\n\nBut the people figuring it out now will define the next decade.',
    tags: ['ai', 'agents', 'opinion'],
    user: 'arjunpatel',
  },
  {
    type: 'looking_for',
    content:
      'I am looking for ML engineers interested in drug discovery.\n\nWe have a working pipeline for predicting protein-ligand interactions. Looking to build a research project together.\n\nNot a startup yet — just exciting research.',
    tags: ['biotech', 'ai', 'research'],
    user: 'ananyabanerjee',
  },
  {
    type: 'milestone',
    content:
      'Our climate venture just signed our first industrial pilot 🌱\n\nA cement company will deploy our carbon capture system in Q2.\n\nIf it works at industrial scale, we are looking at 50,000 tons CO2/year captured.',
    tags: ['climate', 'cleantech', 'milestone'],
    user: 'snehaiyer',
  },
  {
    type: 'discussion',
    content:
      'Founders, what is the ONE thing you wish you knew before starting?\n\nMine: customer interviews are a skill. I thought I was doing them right for 2 years. I was not.',
    tags: ['startup', 'discussion', 'learnings'],
    user: 'meerakrishnan',
  },
  {
    type: 'build_log',
    content:
      'Today I learned that good design is invisible.\n\nUsers do not say "great design." They just use the product and never complain about confusion.\n\nThat silence is the metric.',
    tags: ['design', 'product'],
    user: 'priyasharma',
  },
  {
    type: 'launch',
    content:
      '🎉 We just shipped our redesigned onboarding flow.\n\nUser activation went from 23% → 41% in A/B tests.\n\nLesson: most users do not need more features. They need to understand what you have.',
    tags: ['design', 'product', 'growth'],
    user: 'priyasharma',
  },
  {
    type: 'idea',
    content:
      'What if every Indian college had a startup studio that turns student research into ventures?\n\nMost research dies after the thesis. With proper packaging + funding + mentorship, 5% could become real companies.\n\nThis is the gap DSRT could fill.',
    tags: ['ecosystem', 'startup', 'india'],
    user: 'rheakapoor',
  },
  {
    type: 'build_log',
    content:
      'Week 8 of building in public.\n\nWhat changed:\n• Pricing page rewritten 3 times\n• Cut 4 features (good)\n• Added live chat (annoying but converts)\n• MRR: $1,240 (up from $0 two months ago)\n\nSlow and steady.',
    tags: ['saas', 'buildinpublic'],
    user: 'kabirshah',
  },
  {
    type: 'looking_for',
    content:
      'Hosting a Robotics Builders meetup at CGEC next Sunday.\n\n10-15 people, hands-on session building line-following bots.\n\nDM if you want to join. Free pizza and parts.',
    tags: ['event', 'robotics', 'community'],
    user: 'vikramrao',
  },
  {
    type: 'discussion',
    content:
      'Reading "The Hard Thing About Hard Things" again.\n\nBen Horowitz writes:\n\n"The only thing that prepares you to run a company is running a company."\n\nThree years in and I finally understand what he meant.',
    tags: ['books', 'startup', 'learning'],
    user: 'arnavdesai',
  },
  {
    type: 'launch',
    content:
      'Open beta is live 🚀\n\nWe built a tool to help researchers turn papers into shareable summaries with one click.\n\n100 invites available. First come first served.\n\nLink in comments.',
    tags: ['launch', 'research', 'ai'],
    user: 'aditya kumar'.replace(' ', ''),
  },
  {
    type: 'idea',
    content:
      'Communities > followers.\n\n10 engaged builders > 10,000 random followers.\n\nDSRT gets this right.',
    tags: ['community', 'platforms'],
    user: 'nishagupta',
  },
  {
    type: 'milestone',
    content:
      '✨ We just got accepted into our first accelerator.\n\nStarting March 1st. 3 months. NYC + Bangalore.\n\nA year ago this was a sketch on a napkin. Grateful.',
    tags: ['accelerator', 'milestone', 'startup'],
    user: 'tarameNON',
  },
]

// ============================================================
// SAMPLE VENTURES
// ============================================================
const sampleVentures = [
  {
    name: 'DroneNav AI',
    tagline: 'Autonomous navigation for agricultural drones',
    vision:
      'A world where every Indian farmer has access to autonomous aerial monitoring of their crops, regardless of GPS coverage or technical expertise.',
    description:
      'Building computer vision based navigation systems for drones operating in agricultural environments without reliable GPS.',
    stage: 'mvp',
    category: ['Robotics', 'AgriTech', 'AI / Machine Learning'],
    founder: 'rohanmehta',
  },
  {
    name: 'PulseClinic',
    tagline: 'Offline-first diagnostics for rural healthcare',
    vision:
      'Bringing world-class diagnostic capabilities to every rural health worker, even without internet or specialized training.',
    description:
      'Mobile diagnostic platform with AI-powered disease detection that works completely offline. Currently deployed in 12 rural clinics.',
    stage: 'launched',
    category: ['HealthTech', 'AI / Machine Learning', 'BioTech'],
    founder: 'meerakrishnan',
  },
  {
    name: 'CarbonForge',
    tagline: 'Industrial carbon capture made affordable',
    vision:
      'A future where every industrial facility captures more CO2 than it emits. Profitable climate action.',
    description:
      'Novel chemical process for capturing CO2 from cement and steel manufacturing at 1/3 the cost of existing solutions.',
    stage: 'building',
    category: ['Climate', 'CleanTech', 'Manufacturing'],
    founder: 'snehaiyer',
  },
  {
    name: 'LearnLoop',
    tagline: 'Interactive STEM learning for Indian schools',
    vision:
      'Every child in India learns by doing, not memorizing. Hands-on STEM education at the price of textbooks.',
    description:
      'Web-based interactive STEM curriculum used in 30+ schools, reaching 50,000+ students.',
    stage: 'growing',
    category: ['EdTech', 'AI / Machine Learning'],
    founder: 'tarameNON',
  },
  {
    name: 'Finstack',
    tagline: 'Banking infrastructure for Indian SMBs',
    vision:
      'Every small business in India gets the financial tools of a Fortune 500 company.',
    description:
      'API-first banking, invoicing, and accounting platform built specifically for Indian SMB workflows.',
    stage: 'mvp',
    category: ['FinTech', 'SaaS'],
    founder: 'arnavdesai',
  },
  {
    name: 'AgentForge',
    tagline: 'Build production AI agents in minutes',
    vision:
      'Make AI agents as easy to build and deploy as websites are today.',
    description:
      'Visual builder for AI agents with built-in memory, tool use, and observability. Used by 200+ developers.',
    stage: 'mvp',
    category: ['AI / Machine Learning', 'Developer Tools', 'SaaS'],
    founder: 'arjunpatel',
  },
  {
    name: 'OrbitOne',
    tagline: 'Affordable cubesats for atmospheric research',
    vision:
      'Democratize access to space-based research for universities and research labs globally.',
    description:
      'Building 1U cubesats with standardized payload interfaces for atmospheric sensing missions.',
    stage: 'building',
    category: ['Space', 'Aerospace', 'Hardware'],
    founder: 'arjunnair',
  },
  {
    name: 'GenomeIQ',
    tagline: 'AI-driven drug discovery for neglected diseases',
    vision:
      'Cures for diseases that affect millions but get ignored by pharma economics.',
    description:
      'Machine learning pipelines for predicting drug-protein interactions, focused on diseases endemic to South Asia.',
    stage: 'idea',
    category: ['BioTech', 'AI / Machine Learning', 'HealthTech'],
    founder: 'ananyabanerjee',
  },
]

// ============================================================
// SAMPLE PROJECTS
// ============================================================
const sampleProjects = [
  {
    title: 'Smart Irrigation Controller',
    tagline: 'IoT system that waters plants only when needed',
    description:
      'Soil moisture sensors + ESP32 + cloud dashboard. Reduces water usage by 40%. Open hardware design.',
    stage: 'shipped',
    category: ['IoT', 'AgriTech', 'Hardware'],
    tech_stack: ['ESP32', 'MQTT', 'React', 'TimescaleDB'],
    github_url: 'https://github.com/example/smart-irrigation',
    creator: 'vikramrao',
  },
  {
    title: 'Markdown to Voice',
    tagline: 'Turn your blog into a podcast in one click',
    description:
      'Uses Claude + ElevenLabs to convert markdown articles into natural-sounding audio. Self-hostable.',
    stage: 'prototype',
    category: ['AI/ML', 'Creator Tools', 'Open Source'],
    tech_stack: ['Next.js', 'TypeScript', 'Anthropic API', 'ElevenLabs'],
    creator: 'karansingh',
  },
  {
    title: 'Local-First Notes',
    tagline: 'Notes app that syncs P2P. No servers.',
    description:
      'Built with Automerge for CRDT-based conflict resolution. Works offline. Syncs over WebRTC.',
    stage: 'building',
    category: ['Productivity', 'Open Source'],
    tech_stack: ['Rust', 'Tauri', 'Automerge', 'WebRTC'],
    creator: 'karansingh',
  },
  {
    title: 'StudyBuddy Bot',
    tagline: 'AI tutor for JEE/NEET aspirants',
    description:
      'Telegram bot that answers physics, chemistry, and math questions using a domain-specific RAG pipeline.',
    stage: 'prototype',
    category: ['AI/ML', 'EdTech'],
    tech_stack: ['Python', 'LangChain', 'Pinecone', 'Telegram API'],
    creator: 'adityakumar',
  },
  {
    title: 'Hostel Mess Menu App',
    tagline: 'Never miss what is for dinner',
    description:
      'Simple PWA used by 800+ students at IIT Bombay. Daily menu, push notifications, ratings.',
    stage: 'shipped',
    category: ['Mobile', 'Open Source'],
    tech_stack: ['Next.js', 'PWA', 'Supabase'],
    creator: 'arjunpatel',
  },
  {
    title: 'Carbon Footprint Tracker',
    tagline: 'Track and reduce your daily emissions',
    description:
      'Mobile app that logs your transport, food, and shopping. Suggests practical reductions.',
    stage: 'building',
    category: ['Climate', 'Mobile'],
    tech_stack: ['React Native', 'Node.js', 'Postgres'],
    creator: 'snehaiyer',
  },
  {
    title: 'Resume to Portfolio',
    tagline: 'Upload PDF resume, get a website',
    description:
      'AI extracts your experience from a resume and generates a beautiful portfolio website. Free.',
    stage: 'shipped',
    category: ['AI/ML', 'Creator Tools', 'Web Development'],
    tech_stack: ['Next.js', 'OpenAI', 'Vercel'],
    creator: 'kabirshah',
  },
  {
    title: 'Drone Flight Logger',
    tagline: 'Open source flight data logger',
    description:
      'Records telemetry from any drone with MAVLink support. Analyze flights, detect anomalies, share logs.',
    stage: 'building',
    category: ['Hardware', 'Open Source', 'Robotics'],
    tech_stack: ['Python', 'MAVLink', 'InfluxDB', 'Grafana'],
    github_url: 'https://github.com/example/drone-logger',
    creator: 'rohanmehta',
  },
  {
    title: 'Genome Browser Lite',
    tagline: 'Lightweight genome visualization in the browser',
    description:
      'WebGL-based genome browser for student research. No server needed. Works on cheap laptops.',
    stage: 'prototype',
    category: ['Data Science', 'Web Development', 'Research'],
    tech_stack: ['WebGL', 'TypeScript', 'WASM'],
    creator: 'ananyabanerjee',
  },
  {
    title: 'Community Hackathon Platform',
    tagline: 'Host hackathons for your community',
    description:
      'Self-hosted Devpost alternative. Registration, teams, submissions, judging.',
    stage: 'idea',
    category: ['Web Development', 'Open Source'],
    tech_stack: ['Next.js', 'Postgres', 'Auth.js'],
    creator: 'nishagupta',
  },
  {
    title: 'AI Code Reviewer',
    tagline: 'PR reviews with context awareness',
    description:
      'GitHub bot that reviews PRs using project conventions. Trained on your codebase.',
    stage: 'prototype',
    category: ['AI/ML', 'DevOps', 'Open Source'],
    tech_stack: ['Python', 'GitHub API', 'OpenAI', 'tree-sitter'],
    creator: 'arjunpatel',
  },
  {
    title: 'Mental Health Check-in',
    tagline: 'Anonymous daily mood tracking for students',
    description:
      'Web-based daily check-in. Aggregated, anonymous insights for college counselors.',
    stage: 'building',
    category: ['Web Development', 'Research'],
    tech_stack: ['Next.js', 'Postgres'],
    creator: 'meerakrishnan',
  },
]

// ============================================================
// SAMPLE HACKATHONS
// ============================================================
const sampleHackathons = [
  {
    title: 'IIT Bombay Techfest Hackathon 2025',
    tagline: '48 hours. Build something for India.',
    description:
      'India\'s largest college hackathon. 5000+ participants. Themes across AI, healthcare, climate, and social impact.',
    host_name: 'IIT Bombay',
    start_offset_days: 14,
    end_offset_days: 16,
    registration_offset_days: 10,
    prize_pool: '₹15,00,000',
    location: 'Mumbai',
    mode: 'in-person',
    themes: ['AI', 'HealthTech', 'Climate', 'Social Impact'],
    participants: 3247,
    status: 'upcoming',
  },
  {
    title: 'Hackathon for Climate',
    tagline: 'Build solutions for climate change',
    description:
      'A weekend dedicated to climate tech. Mentors from CleanMax, ReNew Power, and Climate Collective.',
    host_name: 'Climate Collective India',
    start_offset_days: 21,
    end_offset_days: 23,
    registration_offset_days: 18,
    prize_pool: '₹5,00,000',
    location: 'Bangalore + Online',
    mode: 'hybrid',
    themes: ['Climate', 'CleanTech', 'CleanTech'],
    participants: 892,
    status: 'upcoming',
  },
  {
    title: 'AgriTech Innovation Challenge',
    tagline: 'Solve real problems for Indian farmers',
    description:
      'Partner with ICAR. Top 10 teams get pilot deployments. Mentorship from agritech founders.',
    host_name: 'ICAR + StartupIndia',
    start_offset_days: 30,
    end_offset_days: 35,
    registration_offset_days: 25,
    prize_pool: '₹10,00,000',
    location: 'Multiple cities',
    mode: 'hybrid',
    themes: ['AgriTech', 'IoT', 'AI'],
    participants: 567,
    status: 'upcoming',
  },
  {
    title: 'BuildForBharat Hackathon',
    tagline: 'Tech for Tier 2/3 India',
    description:
      'Focus on solutions for users in smaller cities and rural India. Low-bandwidth, offline-first, vernacular.',
    host_name: 'Bharat Tech Forum',
    start_offset_days: 7,
    end_offset_days: 9,
    registration_offset_days: 5,
    prize_pool: '₹3,00,000',
    location: 'Online',
    mode: 'online',
    themes: ['FinTech', 'EdTech', 'HealthTech', 'AgriTech'],
    participants: 1245,
    status: 'upcoming',
  },
]

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
}

async function ensureUser(u: any): Promise<string | null> {
  // Check if user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', u.username)
    .maybeSingle()

  if (existing) return existing.id

  // Create auth user
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email: u.email,
      password: 'DemoUser123!',
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    })

  if (authError || !authUser.user) {
    console.error('Failed to create auth user:', u.email, authError)
    return null
  }

  // Wait briefly for trigger to create base user row
  await new Promise((r) => setTimeout(r, 500))

  // Update profile with details
  const { error: updateError } = await supabase
    .from('users')
    .update({
      username: u.username,
      full_name: u.full_name,
      tagline: u.tagline,
      bio: u.bio,
      location: u.location,
      avatar_url: avatarUrl(u.avatar_seed),
      brings: u.brings,
      seeking: u.seeking,
      interest_topics: u.interest_topics,
      onboarding_complete: true,
      last_active: new Date().toISOString(),
    })
    .eq('id', authUser.user.id)

  if (updateError) {
    console.error('Failed to update profile:', u.email, updateError)
  }

  return authUser.user.id
}

async function uniqueSlug(table: string, base: string): Promise<string> {
  let slug = slugify(base, { lower: true, strict: true })
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (data) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`
  }
  return slug
}

// ============================================================
// MAIN HANDLER
// ============================================================

export async function GET() {
  const stats = {
    users_created: 0,
    posts_created: 0,
    ventures_created: 0,
    projects_created: 0,
    hackathons_created: 0,
    errors: [] as string[],
  }

  const userIds: Record<string, string> = {}

  // 1. Create users
  for (const u of sampleUsers) {
    const id = await ensureUser(u)
    if (id) {
      userIds[u.username] = id
      stats.users_created++
    } else {
      stats.errors.push(`User: ${u.username}`)
    }
  }

  // 2. Create posts
  for (const p of samplePosts) {
    const userId = userIds[p.user]
    if (!userId) continue

    const { error } = await supabase.from('posts').insert({
      user_id: userId,
      type: p.type,
      content: p.content,
      tags: p.tags,
      visibility: 'global',
      created_at: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })

    if (!error) stats.posts_created++
    else stats.errors.push(`Post by ${p.user}`)
  }

  // 3. Create ventures
  for (const v of sampleVentures) {
    const founderId = userIds[v.founder]
    if (!founderId) continue

    const slug = await uniqueSlug('startups', v.name)
    const fullDescription = `## Vision\n${v.vision}\n\n## About\n${v.description}`

    const { data: venture, error } = await supabase
      .from('startups')
      .insert({
        name: v.name,
        slug,
        tagline: v.tagline,
        description: fullDescription,
        stage: v.stage,
        category: v.category,
        founder_id: founderId,
        founded_date: new Date().toISOString().split('T')[0],
        is_verified: Math.random() > 0.5,
      })
      .select()
      .single()

    if (venture && !error) {
      await supabase.from('startup_members').insert({
        startup_id: venture.id,
        user_id: founderId,
        role: 'Founder',
        title: 'Founder',
        joined_date: new Date().toISOString().split('T')[0],
        status: 'active',
      })
      stats.ventures_created++
    }
  }

  // 4. Create projects
  for (const p of sampleProjects) {
    const creatorId = userIds[p.creator]
    if (!creatorId) continue

    const slug = await uniqueSlug('projects', p.title)

    const { error } = await supabase.from('projects').insert({
      title: p.title,
      slug,
      tagline: p.tagline,
      description: p.description,
      stage: p.stage,
      category: p.category,
      tech_stack: p.tech_stack,
      github_url: (p as any).github_url || null,
      creator_id: creatorId,
      started_date: new Date(
        Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0],
      is_open: Math.random() > 0.3,
      is_hiring: Math.random() > 0.6,
    })

    if (!error) stats.projects_created++
  }

  // 5. Create hackathons
  for (const h of sampleHackathons) {
    const slug = await uniqueSlug('hackathons', h.title)
    const now = Date.now()

    const { error } = await supabase.from('hackathons').insert({
      title: h.title,
      slug,
      tagline: h.tagline,
      description: h.description,
      host_name: h.host_name,
      start_date: new Date(
        now + h.start_offset_days * 24 * 60 * 60 * 1000
      ).toISOString(),
      end_date: new Date(
        now + h.end_offset_days * 24 * 60 * 60 * 1000
      ).toISOString(),
      registration_deadline: new Date(
        now + h.registration_offset_days * 24 * 60 * 60 * 1000
      ).toISOString(),
      prize_pool: h.prize_pool,
      location: h.location,
      mode: h.mode,
      themes: h.themes,
      participants: h.participants,
      status: h.status,
    })

    if (!error) stats.hackathons_created++
  }

  // 6. Generate editorial posts (call existing endpoint)
  try {
    for (let i = 0; i < 12; i++) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/editorial/generate`,
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET || ''}`,
          },
        }
      )
      await res.json()
      await new Promise((r) => setTimeout(r, 1200))
    }
  } catch (e) {
    stats.errors.push('Editorial generation failed')
  }

  return NextResponse.json({
    success: true,
    ...stats,
  })
}