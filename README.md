# Cancer Research Aggregator

A web-based research aggregation platform that uses AI to surface and summarize significant cancer treatment developments and breakthroughs. Makes it easy for non-researchers to stay informed about meaningful progress in cancer research.

## Features

### MVP (v1) - Current Implementation

- ✅ **Automated Research Discovery**: Fetch and analyze recent cancer research from PubMed
- ✅ **AI-Powered Summarization**: Claude analyzes articles and generates plain-language summaries
- ✅ **Smart Filtering**: Filter by impact level, cancer type, treatment category, and research phase
- ✅ **Full-Text Search**: Search across all research entries
- ✅ **Rich Analytics Dashboard**: Visualize trends with interactive charts
- ✅ **Impact Level Indicators**: Visual indicators for breakthrough, significant, incremental, and early-stage research
- ✅ **Admin Panel**: Manually trigger data fetches and monitor system status
- ✅ **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **AI Provider**: Anthropic Claude API
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

1. **Node.js** 18+ installed
2. **Neon Database** account ([neon.tech](https://neon.tech))
3. **Anthropic API Key** ([console.anthropic.com](https://console.anthropic.com))
4. **(Optional)** NCBI API Key for higher rate limits ([ncbi.nlm.nih.gov/account](https://www.ncbi.nlm.nih.gov/account/))

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd cancer-research-aggregator
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# PubMed/NCBI API (optional but recommended)
NCBI_API_KEY=your_ncbi_api_key

# Admin Authentication
ADMIN_PASSWORD=your_secure_password

# Vercel Cron Security (for production)
CRON_SECRET=your_random_secret_string
```

4. **Set up the database**

Generate and push the database schema to Neon:

```bash
npm run db:push
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First-Time Setup

1. Navigate to `/admin` in your browser
2. Enter your admin password (from `.env` file)
3. Click "Trigger Daily Fetch" to populate the database with initial research entries
4. Wait for the process to complete (may take a few minutes)
5. Navigate back to the home page to see the research entries

## Usage

### Main Feed (Homepage)

- Browse all research entries in reverse chronological order
- Use the sidebar to filter by:
  - Impact Level (breakthrough, significant, incremental, early stage)
  - Cancer Type (breast, lung, colorectal, etc.)
  - Treatment Category (immunotherapy, targeted therapy, etc.)
  - Research Phase (preclinical, phase 1-3, FDA review, approved)
- Click on any entry to view full details
- Use the search bar for full-text search

### Insights Page

View analytics and trends:
- Total entries and recent activity
- Impact level distribution
- Treatment category breakdown
- Top cancer types being researched
- Research phase distribution
- Source type statistics

### Admin Panel

Protected by password authentication:
- Manually trigger data fetches from PubMed
- View fetch results and statistics
- Monitor system configuration status

## Database Schema

### Research Entries

Stores analyzed cancer research articles with:
- Core content (title, summary, plain language summary)
- Classification (impact level, cancer types, treatment category, research phase)
- Source tracking (URL, type, journal, authors, DOI)
- AI metadata (confidence score, model used)

### Digests (Future)

Will store weekly and monthly research summaries.

### Fetch Logs

Tracks automated and manual data fetch jobs.

### Monthly Stats

Aggregated statistics for performance optimization.

## API Routes

- `GET /api/entries` - List entries with filtering
- `POST /api/entries` - Create entry (admin only)
- `GET /api/entries/[id]` - Get single entry
- `GET /api/entries/search` - Full-text search
- `GET /api/stats/overview` - Analytics overview
- `GET /api/stats/time-series` - Time series data
- `POST /api/admin/trigger` - Trigger manual fetch (admin only)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

### Database Migrations

When deploying, ensure your database schema is up to date:

```bash
npm run db:push
```

## Future Enhancements (v2 & v3)

### v2 Features
- Additional API integrations (ClinicalTrials.gov, NIH Reporter)
- AI web search for institutional announcements
- Automated daily cron jobs
- Weekly and monthly digest generation
- RSS feed
- Email subscriptions

### v3 Ideas
- User accounts with saved/bookmarked research
- Custom alerts (notify about specific cancer types)
- Public API for data consumption
- Embeddable widgets
- Comparison tools

## Architecture

### Data Flow

1. **Fetch**: PubMed API returns recent cancer research articles
2. **Assess**: Claude AI evaluates significance and extracts metadata
3. **Store**: Significant entries are saved to Neon database
4. **Display**: Next.js pages fetch and display data with filtering
5. **Analyze**: Stats APIs aggregate data for analytics dashboard

### AI Assessment Pipeline

Each article is analyzed by Claude to determine:
- **Significance**: Is this worth including?
- **Impact Level**: Breakthrough, significant, incremental, or early stage?
- **Classification**: Cancer types, treatment category, research phase
- **Summaries**: Technical summary + plain language explanation
- **Implications**: Key takeaways for non-experts

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

### Adding UI Components

This project uses shadcn/ui. To add new components:

```bash
npx shadcn-ui@latest add <component-name>
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

- Cancer research data sourced from PubMed/NCBI
- AI summarization powered by Anthropic Claude
- Built with Next.js, Tailwind CSS, and shadcn/ui

---

**Note**: This is a research aggregation tool for informational purposes only. Always consult with qualified healthcare professionals for medical advice.
