const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// 取得 Blogger 文章列表（使用 JSON feed，避免解析 HTML 結構不穩定）
app.get('/api/articles', async (req, res) => {
  try {
    const feedUrl = 'https://linggle-offbeatenglish.blogspot.com/feeds/posts/summary?alt=json&max-results=500';
    const response = await axios.get(feedUrl, { timeout: 15000 });

    const feed = response.data && response.data.feed;
    if (!feed || !Array.isArray(feed.entry)) {
      return res.json([]);
    }

    const articles = feed.entry.map((entry, index) => {
      const title = entry.title && entry.title.$t ? entry.title.$t : `Post ${index + 1}`;
      const published = entry.published && entry.published.$t ? entry.published.$t : '';
      const summary = entry.summary && entry.summary.$t ? entry.summary.$t : '';

      let link = '';
      if (Array.isArray(entry.link)) {
        const alt = entry.link.find(l => l.rel === 'alternate');
        link = alt ? alt.href : '';
      }

      const id = entry.id && entry.id.$t ? entry.id.$t : `feed-${index}`;

      return {
        id,
        title,
        date: published,
        excerpt: summary.replace(/<[^>]+>/g, '').slice(0, 220) + (summary ? '...' : ''),
        content: '',
        difficulty: 'Intermediate',
        wordCount: summary.length,
        originalUrl: link,
        source: 'feed'
      };
    });

    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feed', details: err.message });
  }
});

// 取得單篇文章內容（以 URL 為準）
app.get('/api/article', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url parameter' });

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    const selectors = ['.post-body', '.entry-content', '.content', '.post-content', 'article'];
    const stopPhrases = [
      'SOURCE', 'LEARNING TOOLS', 'CHECK OUT OUR OTHER PAGES', 'ALWAYS SOMETHING NEW',
      'Ask Teacher Jack', 'ARCHIVE/JOKES', 'TEACHER JACK', 'IDIOMS', 'ENGLISH FACTS',
      'COME BACK SOON', 'Quizlet', 'Dictionary', 'Linggle', 'Text-to-Speech', 'English questions'
    ];
    const shouldStop = (text) => stopPhrases.some(k => text.toUpperCase().includes(k.toUpperCase()));

    // 找到主要內容容器
    let container = null;
    for (const sel of selectors) {
      const el = $(sel).first();
      if (el && el.length && el.text().trim().length > 0) {
        container = el;
        break;
      }
    }
    if (!container) container = $('article').first().length ? $('article').first() : $('body');

    // 從容器內收集「正文」段落，遇到停用詞即停止
    const paragraphs = [];
    container.find('p').each((_, p) => {
      const raw = $(p).text().replace(/\s+/g, ' ').trim();
      if (!raw) return;
      if (shouldStop(raw)) return false; // 中止 each()
      // 排除過短或純導航/按鈕內容
      if (raw.length < 20) return;
      paragraphs.push(raw);
    });

    // 文字與 HTML（僅保留處理後的段落，且移除圖片/內嵌樣式）
    const contentText = paragraphs.join('\n\n');
    const contentHtml = paragraphs.map(t => `<p>${t}</p>`).join('');

    const title = $('h1, .post-title, .entry-title').first().text().trim();

    res.json({
      title,
      content: contentText,
      contentHtml,
      wordCount: contentText.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch article', details: err.message });
  }
});

// 提供 React 靜態檔案與 SPA fallback（需先 npm run build）
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});



