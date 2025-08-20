# Linggle Reading - AI-Powered Reading Comprehension Platform

An AI-assisted reading comprehension web app built with React. It fetches Offbeat English articles and generates interactive quizzes from the content.

### Key Features
- Article discovery: pull recent articles from Offbeat English (via feed or direct scrape when needed)
- Quiz generation: auto-generated questions (MCQ, fill-in-the-blank, true/false)
- Instant feedback: grading and explanations after submission
- Clean UI: Tailwind-based responsive layout, mobile-friendly

### Tech Stack
- React 18, React Router, Tailwind CSS, Lucide Icons
- Node/Express backend (`server.js`) serving both API and static build
- Axios + Cheerio for fetching and parsing article content

## Getting Started

Prerequisites
- Node.js 16+ (18+ recommended)
- npm

Install dependencies
```bash
npm install
```

Run in development (frontend + API)
```bash
npm run dev
```

Build for production
```bash
npm run build
```

Serve production build with the Node server
```bash
npm run start:prod
# or one-shot: build then start
npm run serve
```

The server exposes:
- GET `/api/articles`: list articles (via Blogger JSON feed)
- GET `/api/article?url=...`: fetch a single article’s main content

On the client, `articleService` auto-detects the API base URL:
- Local dev: `http://localhost:4000`
- Deployed: same origin (relative `/api`)


## Project Structure
```
linggle_reading/
├── public/
├── src/
│   ├── components/
│   ├── services/
│   ├── App.js
│   ├── index.js
│   └── index.css
├── server.js            # Express API + static file server (SPA fallback)
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## NPM Scripts
- `dev`: run client and server together for development
- `build`: create production bundle
- `start:prod`: start Node server (serves build + API)
- `serve`: build then start in one command

## Contributing
Issues and PRs are welcome.

## License
MIT

## Notes
- Some quiz content is generated from mock logic for demo purposes. Swap in a real LLM/API for production-quality question generation.
