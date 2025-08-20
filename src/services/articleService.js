import axios from 'axios';
import * as cheerio from 'cheerio';
import { getAllArticles, getArticleById } from '../data/articles.js';

// 根據埠號與環境自動決定 API Base URL
// - 本機開發（react-scripts 3000 + server 4000）→ http://localhost:4000
// - 部署後（同網域）→ 相對路徑 ''
const detectApiBaseUrl = () => {
  try {
    if (typeof window !== 'undefined') {
      const isLocalhost = /localhost|127\.0\.0\.1|\.local/.test(window.location.hostname);
      if (isLocalhost) return 'http://localhost:4000';
    }
  } catch {}
  return '';
};

const API_BASE = detectApiBaseUrl();

// Offbeat English 網站 URL
const OFFBEAT_ENGLISH_URL = 'https://linggle-offbeatenglish.blogspot.com/p/english-jokes-and-some-helpful-hints.html';

// 從網站抓取的文章列表（動態更新）
let offbeatEnglishArticles = [];

// 文章內容快取
const articleContentCache = new Map();

class ArticleService {
  constructor() {
    this.cachedArticles = null;
    this.lastFetchedAt = 0;
    this.cacheTtlMs = 5 * 60 * 1000; // 5 minutes
  }

  // 從 Offbeat English 網站抓取文章列表
  async fetchArticlesFromWebsite() {
    try {
      console.log('Fetching articles from Offbeat English website...');
      
      const response = await axios.get(OFFBEAT_ENGLISH_URL, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const articles = [];
      
      // 創建標題到 URL 的映射
      const titleToUrlMap = new Map();
      
      // 從頁面中提取所有文章鏈接
      $('a[href*="linggle-offbeatenglish.blogspot.com"]').each((index, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        // 只處理文章鏈接（排除主頁鏈接）
        if (href && href.includes('/2022/10/') && text) {
          titleToUrlMap.set(text.toUpperCase(), href);
        }
      });
      
      // 解析文章列表（根據網站結構）
      $('body').find('strong').each((index, element) => {
        const text = $(element).text().trim();
        
        // 匹配文章標題格式：數字 + 標題
        const match = text.match(/^(\d+)\s+(.+)$/);
        if (match) {
          const number = parseInt(match[1]);
          const title = match[2].trim();
          
          // 嘗試從映射中找到正確的 URL
          let articleUrl = titleToUrlMap.get(title.toUpperCase());
          
          // 如果找不到，使用備用方法構建 URL
          if (!articleUrl) {
            articleUrl = this.buildArticleUrl(title, number);
          }
          
          articles.push({
            id: number.toString(),
            title: title,
            number: number,
            date: 'From Offbeat English',
            excerpt: `Article ${number}: ${title}`,
            content: '',
            difficulty: 'Intermediate',
            wordCount: 150,
            originalUrl: articleUrl,
            source: 'website',
            articleNumber: number
          });
        }
      });

      // 更新全局文章列表
      offbeatEnglishArticles = articles;
      console.log(`Successfully fetched ${articles.length} articles from website`);
      
      return articles;
    } catch (error) {
      console.error('Error fetching articles from website:', error.message);
      return [];
    }
  }

  // 構建文章 URL
  buildArticleUrl(title, number) {
    // 根據實際網站結構構建 URL
    const titleSlug = title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // 使用 2022/10 格式，因為這是實際的日期格式
    return `https://linggle-offbeatenglish.blogspot.com/2022/10/${titleSlug}.html`;
  }

  // 清理文章內容，移除廣告和不必要的內容
  cleanArticleContent(content) {
    if (!content) return '';
    
    let cleaned = content;
    
    // 移除網站特定的標記和不需要的內容
    const unwantedPatterns = [
      /\[Convenient New Feature: ARCHIVE of All Articles\]/gi,
      /©\s*odditycentral\.com/gi,
      /advertisement/gi,
      /sponsored/gi,
      /click here/gi,
      /subscribe/gi,
      /follow us/gi,
      /share this/gi,
      /related articles/gi,
      /you might also like/gi,
      /read more/gi,
      /continue reading/gi,
      /loading\.\.\./gi,
      /please wait/gi,
      /cookie policy/gi,
      /privacy policy/gi,
      /terms of service/gi,
      /contact us/gi,
      /about us/gi,
      /home/gi,
      /search/gi,
      /menu/gi,
      /navigation/gi,
      /sidebar/gi,
      /widget/gi,
      /footer/gi,
      /header/gi,
      /copyright/gi,
      /all rights reserved/gi,
      /powered by/gi,
      /blogger/gi,
      /blogspot/gi,
      /google/gi,
      /facebook/gi,
      /twitter/gi,
      /instagram/gi,
      /youtube/gi,
      /linkedin/gi,
      /pinterest/gi,
      /snapchat/gi,
      /tiktok/gi,
      /whatsapp/gi,
      /telegram/gi,
      /discord/gi,
      /reddit/gi,
      /tumblr/gi,
      /medium/gi,
      /wordpress/gi,
      /wix/gi,
      /squarespace/gi,
      /shopify/gi,
      /amazon/gi,
      /ebay/gi,
      /etsy/gi,
      /paypal/gi,
      /stripe/gi,
      /visa/gi,
      /mastercard/gi,
      /american express/gi,
      /discover/gi,
      /chase/gi,
      /bank of america/gi,
      /wells fargo/gi,
      /citibank/gi,
      /capital one/gi
    ];
    
    unwantedPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // 移除多餘的空白字符和空行
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/\n\s*\n/g, '\n');
    
    // 移除開頭的數字和標題（如果存在）
    cleaned = cleaned.replace(/^\d+\s+[A-Z\s]+/, '').trim();
    
    // 確保內容有足夠的長度
    if (cleaned.length < 100) {
      return content; // 如果清理後太短，返回原始內容
    }
    
    return cleaned;
  }

  // 獲取文章列表
  async getArticles() {
    try {
      console.log('Fetching articles (Local Database → Website → API → predefined fallback)...');

      // 若快取有效，直接回傳
      const now = Date.now();
      if (this.cachedArticles && now - this.lastFetchedAt < this.cacheTtlMs) {
        return this.cachedArticles;
      }

      // 1) 優先使用本地數據庫
      const localArticles = getAllArticles();
      if (localArticles.length > 0) {
        console.log(`Using ${localArticles.length} articles from local database`);
        this.cachedArticles = localArticles;
        this.lastFetchedAt = now;
        return this.cachedArticles;
      }

      // 2) 從 Offbeat English 網站抓取
      const websiteArticles = await this.fetchArticlesFromWebsite();
      if (websiteArticles.length > 0) {
        console.log(`Fetched ${websiteArticles.length} articles from website`);
        this.cachedArticles = websiteArticles;
        this.lastFetchedAt = now;
        return this.cachedArticles;
      }

      // 3) 嘗試後端 API
      const apiArticles = await this.fetchFromApi();
      if (apiArticles.length > 0) {
        console.log(`Fetched ${apiArticles.length} articles from API`);
        this.cachedArticles = apiArticles;
        this.lastFetchedAt = now;
        return this.cachedArticles;
      }

      // 4) 使用預定義的文章列表作為備援
      console.log('Using predefined article list as fallback');
      this.cachedArticles = this.getPredefinedArticles();
      this.lastFetchedAt = now;
      return this.cachedArticles;

    } catch (error) {
      console.error('Error fetching articles:', error.message);
      console.log('Using predefined article list as fallback');
      this.cachedArticles = this.getPredefinedArticles();
      this.lastFetchedAt = Date.now();
      return this.cachedArticles;
    }
  }

  // 從本機後端 API 取得文章列表
  async fetchFromApi() {
    try {
      const response = await axios.get(`${API_BASE}/api/articles`, { timeout: 12000 });
      if (Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      console.warn('API not available, fallback to website/predefined. Reason:', error.message);
      return [];
    }
  }

  // 獲取預定義的文章列表（備援）
  getPredefinedArticles() {
    const predefinedArticles = [
  { id: '1', title: 'RARE WINE', number: 1 },
  { id: '2', title: 'RIGHT HAND UP', number: 2 },
  { id: '3', title: 'PUMPKIN BOAT', number: 3 },
  { id: '4', title: 'GADGET FUNERAL', number: 4 },
  { id: '5', title: 'AI CEO', number: 5 },
  { id: '6', title: 'HOT DANCING', number: 6 },
  { id: '7', title: 'COW DOWRY', number: 7 },
  { id: '8', title: 'SPACE CHAMPAGNE', number: 8 },
  { id: '9', title: 'MEATLOAF MASTERPIECE', number: 9 },
  { id: '10', title: 'ROBOT SHOES', number: 10 },
  { id: '11', title: 'LIVING DOLL', number: 11 },
  { id: '12', title: 'TASTELESS CANDY', number: 12 },
  { id: '13', title: 'EDIBLE RESUME', number: 13 },
  { id: '14', title: 'HORSE HOMECOMING', number: 14 },
  { id: '15', title: 'SURPRISE BULLET', number: 15 },
  { id: '16', title: 'SHEEP BEING SHEEP', number: 16 },
  { id: '17', title: 'TINY TV\'S', number: 17 },
  { id: '18', title: 'PRESERVED TATTOOS', number: 18 },
  { id: '19', title: 'MODERN ART MISTAKE', number: 19 },
  { id: '20', title: 'GOLDEN HOUSE', number: 20 },
  { id: '21', title: 'OFFICE HOTROD', number: 21 },
  { id: '22', title: 'TOUGH BIRD', number: 22 },
  { id: '23', title: 'BEER SOLES', number: 23 },
  { id: '24', title: 'BARCODE TATTOO', number: 24 },
  { id: '25', title: 'RIGHT TO BORE', number: 25 },
  { id: '26', title: 'RARE FLOWER', number: 26 },
  { id: '27', title: 'BIONIC EYES', number: 27 },
  { id: '28', title: 'SELF-BETTING', number: 28 },
  { id: '29', title: 'TATTOO MADNESS', number: 29 },
  { id: '30', title: 'IPHONE ROBBERY', number: 30 },
  { id: '31', title: 'MYSTERY HUM', number: 31 },
  { id: '32', title: 'SPA BOAT', number: 32 },
  { id: '33', title: 'INVISIBILITY SUIT', number: 33 },
  { id: '34', title: 'FAKE DOCTOR', number: 34 },
  { id: '35', title: 'LONG-TERM SCAM', number: 35 },
  { id: '36', title: 'DESPERATE FAN', number: 36 },
  { id: '37', title: 'GAME BUSTER', number: 37 },
  { id: '38', title: 'HUGGIE BOT', number: 38 },
  { id: '39', title: 'DUMB PHONE', number: 39 },
  { id: '40', title: 'BIG E-TRUCK', number: 40 },
  { id: '41', title: 'SEMIPRECIOUS CHAIR', number: 41 },
  { id: '42', title: 'SMART TOILET', number: 42 },
  { id: '43', title: 'COLDEST PLACE', number: 43 },
  { id: '44', title: 'WHAM SLAM', number: 44 },
  { id: '45', title: 'PRICEY STAMP', number: 45 },
  { id: '46', title: 'BAD BOT OR BUDDY BOT?', number: 46 },
  { id: '47', title: 'GONE FISHING', number: 47 },
  { id: '48', title: 'PIKACHU ABUSE', number: 48 },
  { id: '49', title: 'HOMELESS AGAIN', number: 49 },
  { id: '50', title: 'JUMBO ERASER', number: 50 },
  { id: '51', title: 'BIGGEST LOSER', number: 51 },
  { id: '52', title: 'NIPPED IN THE BUD', number: 52 },
  { id: '53', title: 'CHEAT GPT', number: 53 },
  { id: '54', title: 'MUSICAL DEFENSE', number: 54 },
  { id: '55', title: 'WORM POOP TEA', number: 55 },
  { id: '56', title: 'KFC INCENSE', number: 56 },
  { id: '57', title: 'SAN-BA EARRINGS', number: 57 },
  { id: '58', title: 'RIDERLESS WINNER', number: 58 },
  { id: '59', title: 'LET THERE BE DARK', number: 59 },
  { id: '60', title: 'NOT QUITE DEAD', number: 60 },
  { id: '61', title: 'STUBBORN FAMILY', number: 61 },
  { id: '62', title: '$2 MILLION DOLLAR MAN', number: 62 },
  { id: '63', title: 'UP ON THE ROOF', number: 63 },
  { id: '64', title: 'HUNGRY KID', number: 64 },
  { id: '65', title: 'DUMB WATCH', number: 65 },
  { id: '66', title: 'A LOT OF DUCKS', number: 66 },
  { id: '67', title: 'RAREST GEM', number: 67 },
  { id: '68', title: 'BIGGEST SUCKER?', number: 68 },
  { id: '69', title: 'BEAUTY BLIND?', number: 69 },
  { id: '70', title: 'BAG LADY', number: 70 },
  { id: '71', title: 'SNAIL MAIL', number: 71 },
  { id: '72', title: 'AI BABY STROLLER', number: 72 },
  { id: '73', title: 'MERMAID HOAX', number: 73 },
  { id: '74', title: 'SNAKE BAIT', number: 74 },
  { id: '75', title: 'QUIET, PLEASE', number: 75 },
  { id: '76', title: 'BIG WINE MISTAKE', number: 76 },
  { id: '77', title: 'GYNOPHOBIA', number: 77 },
  { id: '78', title: 'AIRBAG JEANS', number: 78 },
  { id: '79', title: 'REMOTE KISS', number: 79 },
  { id: '80', title: 'PAYBACK TIME', number: 80 },
  { id: '81', title: 'PURPLE HONEY', number: 81 },
  { id: '82', title: 'PRIZE BELLIES', number: 82 },
  { id: '83', title: 'CAT SCAN', number: 83 },
  { id: '84', title: '$1 BANK ROBBERY', number: 84 },
  { id: '85', title: 'KETCHUP DIET', number: 85 },
  { id: '86', title: 'GOING HEAD TO HEAD', number: 86 },
  { id: '87', title: 'FAKE COUNTRY', number: 87 },
  { id: '88', title: 'AIRLESS BASKETBALL', number: 88 },
  { id: '89', title: 'THREE-YEAR LOCKDOWN', number: 89 },
  { id: '90', title: 'LITTLE DEVIL?', number: 90 },
  { id: '91', title: 'TOUGH LOVE', number: 91 },
  { id: '92', title: 'DESSERT SOAP', number: 92 },
  { id: '93', title: 'METEORITE PURSE', number: 93 },
  { id: '94', title: 'CREEPY DOLL', number: 94 },
  { id: '95', title: 'MOST EXPENSIVE MANSION', number: 95 },
  { id: '96', title: 'BEST FRIEND\'S WIFE\'S "FRIEND"', number: 96 },
  { id: '97', title: 'TOO YOUNG AT HEART', number: 97 },
  { id: '98', title: 'AI ANCHOR', number: 98 },
  { id: '99', title: 'LITTLE SHOPPER', number: 99 },
  { id: '100', title: 'NO-TEL EASTLINK', number: 100 },
  { id: '101', title: 'HAPPY BIRTHDAY, FATIMA!', number: 101 },
  { id: '102', title: 'ROTTEN RACE', number: 102 },
  { id: '103', title: 'NOODLEVILLE', number: 103 },
  { id: '104', title: 'BIRD NERDS', number: 104 },
  { id: '105', title: 'LIVING HITLERS', number: 105 },
  { id: '106', title: 'BEAUTIFUL GRANDPA', number: 106 },
  { id: '107', title: 'SMILE COACH', number: 107 },
  { id: '108', title: 'RIGHT IS WRONG', number: 108 },
  { id: '109', title: 'WELCOME TO EARTH', number: 109 },
  { id: '110', title: 'WINE STING', number: 110 },
  { id: '111', title: 'REAL PHONE LOVE?', number: 111 },
  { id: '112', title: 'FREE BEES', number: 112 },
  { id: '113', title: 'NEVER GIVE YOUR PIN', number: 113 },
  { id: '114', title: 'NEVER GIVE UP', number: 114 },
  { id: '115', title: 'MICKEY DUCK', number: 115 },
  { id: '116', title: 'SLEEP DEEP', number: 116 },
  { id: '117', title: 'FOWL BALL', number: 117 },
  { id: '118', title: 'CRIME AGAINST NOODLES?', number: 118 },
  { id: '119', title: 'WILD, WILD EAST', number: 119 },
  { id: '120', title: 'HOW NOW, BROWN COW', number: 120 },
  { id: '121', title: 'TIME TO GIVE UP?', number: 121 },
  { id: '122', title: 'DAWN OF THE TECH ZOMBIES', number: 122 },
  { id: '123', title: 'A REAL CHEESEBURGER', number: 123 },
  { id: '124', title: 'BERRY EXPENSIVE', number: 124 },
  { id: '125', title: 'MAUI MIRACLE HOUSE', number: 125 },
  { id: '126', title: 'LONG-DISTANCE CALL', number: 126 },
  { id: '127', title: 'SPONGEBOB\'S UBER', number: 127 },
  { id: '128', title: 'NICE CATCH, NICE RELEASE', number: 128 },
  { id: '129', title: 'LAVISH LAV', number: 129 },
  { id: '130', title: 'ROLL, ROLL, ROLL YOUR BOAT', number: 130 },
  { id: '131', title: 'THE ULTIMATE STATUS SYMBOL', number: 131 },
  { id: '132', title: 'WE DO, AGAIN', number: 132 },
  { id: '133', title: 'REALLY NOT HER DAY', number: 133 },
  { id: '134', title: 'FOOD WITH A VIEW', number: 134 },
  { id: '135', title: 'SPECIAL DELIVERY', number: 135 },
  { id: '136', title: 'FANTASY FRUIT', number: 136 },
  { id: '137', title: 'HAIR REMOVER', number: 137 },
  { id: '138', title: 'AWKWARD SECRET', number: 138 },
  { id: '139', title: 'A CLOCKWORK SWAN', number: 139 },
  { id: '140', title: 'WORLD\'S UGLIEST FOUNTAIN', number: 140 },
  { id: '141', title: 'SHADOW MAGIC', number: 141 },
  { id: '142', title: 'SCARY CHRISTMAS', number: 142 },
  { id: '143', title: 'JACK AND ROSE IN VENICE', number: 143 },
  { id: '144', title: 'YELLOW ILLUSION', number: 144 },
  { id: '145', title: 'DON\'T EAT THE ART', number: 145 },
  { id: '146', title: 'UN-CHIC CHICK', number: 146 },
  { id: '147', title: 'EDIBLE FLOWER CONES', number: 147 },
  { id: '148', title: 'MEAT POLICE', number: 148 },
  { id: '149', title: 'BEAT POLICE', number: 149 },
  { id: '150', title: 'CANINE AIRLINES', number: 150 },
  { id: '151', title: 'FELINE PRIME', number: 151 },
  { id: '152', title: 'ELF EARS', number: 152 },
  { id: '153', title: 'QUADRIDEXTROUS ART', number: 153 },
  { id: '154', title: 'PLANTS ARE PEOPLE, TOO', number: 154 },
  { id: '155', title: 'SMART SPOON', number: 155 },
  { id: '156', title: 'PEBBLING', number: 156 },
  { id: '157', title: 'TONE IT DOWN', number: 157 },
  { id: '158', title: 'THE POWER OF POOP', number: 158 },
  { id: '159', title: 'INSTANT SEAPORT', number: 159 },
  { id: '160', title: 'FLAT FIAT', number: 160 },
  { id: '161', title: 'COLLECTOR\'S ITEM', number: 161 },
  { id: '162', title: 'FROM POND SCUM TO FASHION', number: 162 },
  { id: '163', title: 'TAIWAN\'S CONQUERING DUMPLINGS', number: 163 },
  { id: '164', title: 'PRICEY COW CUDDLES', number: 164 },
  { id: '165', title: 'RENT-A-GRANNY', number: 165 },
      { id: '166', title: 'SHOP AROUND THE ROCK', number: 166 },
      { id: '167', title: 'IT\'S A SMALLER WORLD', number: 167 },
      { id: '168', title: 'HIGH AI-NXIETY?', number: 168 }
    ];

    return predefinedArticles.map(article => ({
      id: article.id,
      title: article.title,
      date: 'From Offbeat English',
      excerpt: `Article ${article.number}: ${article.title}`,
      content: '',
      difficulty: 'Intermediate',
      wordCount: 150,
      originalUrl: `https://linggle-offbeatenglish.blogspot.com/search/label/${article.title.replace(/\s+/g, '%20')}`,
      source: 'predefined',
      articleNumber: article.number
    }));
  }

  // 獲取預設內容
  getDefaultContent(title) {
    const contentTemplates = {
      'RARE WINE': `Wine enthusiasts around the world are always on the lookout for unique and rare bottles that tell a story beyond their vintage. The world of rare wines is filled with fascinating tales of discovery, tradition, and sometimes even mystery.

Some of the most sought-after rare wines come from specific regions known for their unique terroir and traditional winemaking methods. These wines often carry with them the history and culture of their place of origin, making them more than just beverages but cultural artifacts.

Collectors and connoisseurs often spend years, even decades, searching for particular bottles that may have been produced in limited quantities or under special circumstances. The rarity of these wines often comes from factors such as small production runs, unique weather conditions during the growing season, or the use of grape varieties that are no longer commonly cultivated.

The value of rare wines isn't just in their taste, but in their story. Each bottle represents a moment in time, a specific combination of weather, soil, and human skill that can never be exactly replicated. This is what makes rare wines so fascinating to collectors and wine lovers alike.`,

      'RIGHT HAND UP': `In many cultures around the world, raising the right hand has significant meaning and is used in various important ceremonies and situations. This gesture is often associated with taking oaths, making promises, or showing respect.

The tradition of raising the right hand likely stems from ancient times when the right hand was considered the "clean" or "honorable" hand, while the left hand was often associated with less savory activities. This belief has persisted through many cultures and religions.

In legal settings, raising the right hand is a universal gesture for taking an oath. Whether in a courtroom, during a citizenship ceremony, or when being sworn into office, this simple gesture carries the weight of truth and commitment.

The right hand is also commonly used in religious ceremonies and rituals. Many faiths use the right hand for blessings, prayers, and other sacred gestures. This practice emphasizes the importance and sanctity of the right hand in spiritual matters.

Even in everyday situations, raising the right hand can signal attention, agreement, or a desire to speak. It's a gesture that transcends language barriers and cultural differences, making it a truly universal form of communication.`,

      'PUMPKIN BOAT': `The idea of using a pumpkin as a boat might sound like something from a fairy tale, but it's actually a creative and environmentally friendly approach to water transportation that has been explored in various parts of the world.

Large pumpkins, particularly varieties like the Atlantic Giant, can grow to enormous sizes, sometimes weighing hundreds of pounds. These massive gourds have thick, sturdy walls that can support weight and provide natural buoyancy in water.

Pumpkin boats have been used in festivals and competitions around the world, where participants carve out the insides of giant pumpkins and use them as vessels for races or leisurely floats down rivers. These events often draw crowds and media attention, showcasing the fun and whimsical side of this unusual watercraft.

The environmental benefits of pumpkin boats are significant. Unlike traditional boats made from wood, metal, or plastic, pumpkins are completely biodegradable. After use, they can be composted or left to decompose naturally, returning nutrients to the soil without any harmful environmental impact.

While pumpkin boats may not be practical for everyday transportation, they serve as an excellent example of how creative thinking can lead to sustainable solutions. They remind us that sometimes the most innovative ideas come from looking at everyday objects in new and unexpected ways.`,

      'GADGET FUNERAL': `In our modern world, technology evolves so rapidly that our once-beloved gadgets become obsolete almost overnight. The concept of a "gadget funeral" has emerged as a way to honor and properly dispose of our electronic companions that have served us well.

A gadget funeral is a ceremonial way to say goodbye to old electronics that are no longer functional or useful. It's a recognition that these devices, despite being inanimate objects, have played important roles in our lives and deserve a respectful farewell.

The ceremony often involves gathering friends and family to share memories of how the gadget was used, what it meant to them, and the experiences it facilitated. People might share photos, stories, or even create small memorials for their departed devices.

Environmental consciousness is also a key aspect of gadget funerals. Instead of simply throwing old electronics in the trash, participants are encouraged to recycle them properly or donate them to organizations that can refurbish and reuse them.

The ritual serves as a reminder of our relationship with technology and how it shapes our daily lives. It also helps people process the rapid pace of technological change and the emotional attachment we can develop to our devices.

Some people even create digital memorials, posting photos and stories about their old gadgets on social media, allowing others to share in the experience and perhaps reflect on their own relationship with technology.`,

      'AI CEO': `The concept of an AI CEO represents one of the most fascinating developments in the intersection of artificial intelligence and business leadership. While it may sound like science fiction, some companies have already begun experimenting with AI-driven decision-making at the highest levels.

An AI CEO would theoretically be able to process vast amounts of data, analyze market trends, and make decisions based on objective analysis rather than human emotion or bias. This could potentially lead to more efficient and data-driven business strategies.

However, the idea of an AI CEO raises important questions about leadership, creativity, and human judgment. While AI excels at processing information and identifying patterns, it may struggle with the nuanced aspects of human relationships, emotional intelligence, and creative problem-solving that are often crucial in business leadership.

The role of a CEO involves more than just making data-driven decisions. It requires inspiring employees, building company culture, handling crises with emotional intelligence, and making judgment calls in situations where data may be incomplete or conflicting.

Some experts believe that the future of business leadership might involve a hybrid approach, where AI handles data analysis and routine decision-making, while human leaders focus on strategy, innovation, and the human aspects of running a company.

The discussion about AI CEOs also highlights broader questions about the future of work and how humans and machines will collaborate in increasingly complex business environments.`
    };

    return contentTemplates[title] || `This is a sample article about ${title}. The content would normally be loaded from the original source, but for demonstration purposes, we're showing this placeholder content.

The article discusses various aspects of ${title} and provides interesting insights into this topic. Readers can learn about different perspectives and gain new knowledge through this engaging content.

This demonstrates how the AI-powered reading comprehension system works, even when the original article content is not available. The system can still generate relevant quiz questions based on this content to test reading comprehension skills.`;
  }

  // 獲取單篇文章
  async getArticle(id) {
    try {
      // 1) 優先從本地數據庫獲取
      const localArticle = getArticleById(id);
      if (localArticle) {
        console.log(`Found article ${id} in local database`);
        return {
          id: localArticle.id,
          title: localArticle.title,
          number: localArticle.number,
          date: localArticle.date,
          excerpt: `Article ${localArticle.number}: ${localArticle.title}`,
          content: localArticle.content,
          difficulty: localArticle.difficulty,
          wordCount: localArticle.wordCount,
          originalUrl: `https://linggle-offbeatenglish.blogspot.com/2022/10/${localArticle.title.toLowerCase().replace(/\s+/g, '-')}.html`,
          source: 'local',
          articleNumber: localArticle.number
        };
      }

      // 2) 如果本地數據庫沒有，從文章列表獲取
      const articles = await this.getArticles();
      let article = articles.find(article => article.id === id);
      
      if (!article) {
        console.error('Article not found:', id);
        return null;
      }
      
      // 檢查快取
      if (articleContentCache.has(id)) {
        const cachedArticle = articleContentCache.get(id);
        return { ...article, ...cachedArticle };
      }
      
      // 如果沒有內容，使用預設內容
      if (!article.content) {
        article.content = this.getDefaultContent(article.title);
        article.wordCount = article.content.length;
      }
      
      // 如果有原始網址且沒有內容，優先透過本機 API 抓取全文
      if (article.originalUrl && !article.content) {
        try {
          console.log('Fetching article content via API from:', article.originalUrl);

          // 先走本機 API
          const apiRes = await axios.get(`${API_BASE}/api/article`, {
            params: { url: article.originalUrl },
            timeout: 12000
          });

          const apiData = apiRes.data || {};
          const apiContent = (apiData.content || '').trim();
          if (apiContent) {
            article.title = apiData.title || article.title;
            article.content = apiContent;
            article.contentHtml = apiData.contentHtml || '';
            article.wordCount = apiContent.length;
            
            // 快取內容
            articleContentCache.set(id, {
              content: article.content,
              contentHtml: article.contentHtml,
              wordCount: article.wordCount
            });
            
            return article;
          }

          // 若 API 失敗或無內容，再回退直接抓網站
          console.log('API content empty, fallback to direct fetch');
          const response = await axios.get(article.originalUrl, {
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          const $ = cheerio.load(response.data);

          // 移除廣告和不需要的元素
          $('script, style, .ads, .advertisement, .sidebar, .widget, .comment, .social-share, .related-posts, .navigation, .pagination, .footer, .header, nav, aside').remove();

          let content = '';
          
          // 根據網站結構抓取內容
          // 1. 先嘗試從 .post-body 或 .entry-content 中抓取
          const contentSelectors = [
            '.post-body',
            '.entry-content',
            '.content',
            '.post-content',
            'article .post-body',
            '.post .post-body',
            '.entry .entry-content'
          ];

          for (const selector of contentSelectors) {
            const element = $(selector);
            if (element.length > 0) {
              // 只取文章主體內容，排除標題、作者、日期等
              element.find('h1, h2, h3, .post-title, .entry-title, .author, .date, .meta, .tags').remove();
              let elementText = element.text().trim();
              
              // 在元素內查找 ARCHIVE 標記
              const archiveIndex = elementText.indexOf('[Convenient New Feature: ARCHIVE of All Articles]');
              if (archiveIndex !== -1) {
                // 找到 ARCHIVE 標記後的所有內容
                let articleText = elementText.substring(archiveIndex);
                
                // 找到文章結束標記 © odditycentral.com
                const endIndex = articleText.indexOf('© odditycentral.com');
                if (endIndex !== -1) {
                  articleText = articleText.substring(0, endIndex);
                }
                
                // 移除 ARCHIVE 標記本身
                articleText = articleText.replace('[Convenient New Feature: ARCHIVE of All Articles]', '').trim();
                
                if (articleText.length > 100) {
                  content = articleText;
                  break;
                }
              } else if (elementText.length > 100) {
                // 如果沒有 ARCHIVE 標記，但有足夠的內容，也使用
                content = elementText;
                break;
              }
            }
          }
          
          // 2. 如果上面的方法失敗，嘗試段落方法
          if (!content || content.length < 100) {
            const paragraphs = $('p').map((i, el) => {
              const text = $(el).text().trim();
              return text.length > 50 ? text : null; // 只保留長度超過50字符的段落
            }).get().filter(Boolean);
            
            content = paragraphs.join('\n\n');
          }

          // 3. 最後備用方案：抓取所有段落，但過濾掉太短的內容
          if (!content || content.length < 100) {
            const paragraphs = $('p').map((i, el) => {
              const text = $(el).text().trim();
              return text.length > 50 ? text : null; // 只保留長度超過50字符的段落
            }).get().filter(Boolean);
            
            content = paragraphs.join('\n\n');
          }

          if (content) {
            // 清理和過濾內容
            const cleanedContent = this.cleanArticleContent(content);
            console.log('Direct fetch content length:', cleanedContent.length);
            article.content = cleanedContent;
            article.wordCount = cleanedContent.length;
            
            // 快取內容
            articleContentCache.set(id, {
              content: article.content,
              wordCount: article.wordCount
            });
          } else {
            console.log('No content found, using excerpt as content');
            article.content = article.excerpt;
            article.wordCount = article.excerpt.length;
          }
        } catch (error) {
          console.error('Error fetching article content:', error.message);
          // 使用摘要作為內容
          article.content = article.excerpt;
          article.wordCount = article.excerpt.length;
        }
      }
      
      return article;
    } catch (error) {
      console.error('Error fetching article:', error.message);
      return null;
    }
  }

  // 生成測驗題目（模擬AI功能）
  async generateQuiz(articleContent) {
    // AI-like 隨機題目生成器（純前端，無需 API key）
    try {
      const normalized = (articleContent || '')
        .replace(/\s+/g, ' ')
        .replace(/\u00A0/g, ' ')
        .trim();

      if (!normalized || normalized.length < 40) {
        return {
          questions: [
        {
          id: 1,
          type: 'true-false',
              question: 'The article contains enough content to generate questions.',
              correctAnswer: false
            }
          ],
          totalQuestions: 1,
          timeLimit: 5
        };
      }

      // 分句（簡單英語斷句）
      const sentences = normalized
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.split(' ').length >= 6);

      // 詞彙池（去除常見停用詞）
      const stopwords = new Set([
        'the','a','an','and','or','but','if','then','so','of','in','on','at','to','for','from','by','with','as',
        'is','are','was','were','be','been','being','am','do','does','did','have','has','had','will','would','can','could','should','may','might',
        'that','this','these','those','it','its','they','them','their','we','us','our','you','your','i','me','my','he','him','his','she','her','hers',
        'not','no','yes','one','two','three','four','five','six','seven','eight','nine','ten'
      ]);

      const words = normalized
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w && !stopwords.has(w) && w.length >= 4);

      const uniqueWords = Array.from(new Set(words));

      function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }

      function pickDistinct(array, count) {
        return shuffle(array).slice(0, Math.min(count, array.length));
      }

      function buildMcqFromSentence(sentence, idBase) {
        const tokenized = sentence.split(/(\b)/);
        const candidates = sentence
          .split(/[^A-Za-z]+/)
          .filter(w => w && !stopwords.has(w.toLowerCase()) && w.length >= 4);

        const target = candidates.length > 0
          ? candidates[randomInt(0, candidates.length - 1)]
          : null;

        if (!target) return null;

        const blanked = tokenized
          .map(t => (t === target ? '____' : t))
          .join('')
          .replace(/\s+/g, ' ')
          .trim();

        const distractors = pickDistinct(
          uniqueWords.filter(w => w !== target.toLowerCase() && Math.abs(w.length - target.length) <= 3),
          8
        );

        while (distractors.length < 3) {
          const fallback = uniqueWords[randomInt(0, Math.max(uniqueWords.length - 1, 0))] || 'option';
          if (!distractors.includes(fallback) && fallback !== target.toLowerCase()) distractors.push(fallback);
        }

        const optionsRaw = shuffle([target, ...distractors.slice(0, 3).map(d => d)])
          .map(opt => opt.match(/^[a-z]+$/) ? opt : opt);

        const options = optionsRaw.map(o => o === o.toLowerCase() ? o : o);
        const correctIndex = options.findIndex(o => o.toLowerCase() === target.toLowerCase());

        return {
          id: idBase,
          type: 'multiple-choice',
          question: `Fill the blank: ${blanked}`,
          options,
          correctAnswer: correctIndex,
          explanation: `The missing word is "${target}".`
        };
      }

      function buildFillInFromSentence(sentence, idBase) {
        const candidates = sentence
          .split(/[^A-Za-z]+/)
          .filter(w => w && !stopwords.has(w.toLowerCase()) && w.length >= 4);
        const target = candidates.length > 0
          ? candidates[randomInt(0, candidates.length - 1)]
          : null;
        if (!target) return null;
        const blanked = sentence.replace(new RegExp(`\\b${target}\\b`), '____');
        return {
          id: idBase,
          type: 'fill-in-blank',
          question: `Fill the blank: ${blanked}`,
          correctAnswer: target.toLowerCase()
        };
      }

      function negateSentenceIfPossible(sentence) {
        // 嘗試簡單否定化
        const replacements = [
          [/\bis\b/i, 'is not'],
          [/\bare\b/i, 'are not'],
          [/\bwas\b/i, 'was not'],
          [/\bwere\b/i, 'were not'],
          [/\bhas\b/i, 'has not'],
          [/\bhave\b/i, 'have not'],
          [/\bcan\b/i, 'cannot'],
          [/\bwill\b/i, 'will not'],
          [/\bdoes\b/i, 'does not'],
          [/\bdo\b/i, 'do not']
        ];
        for (const [pattern, neg] of replacements) {
          if (pattern.test(sentence)) {
            return sentence.replace(pattern, neg);
          }
        }
        return null;
      }

      function buildTrueFalseFromSentence(sentence, idBase) {
        const makeFalse = Math.random() < 0.5;
        let statement = sentence;
        let correctAnswer = true;
        if (makeFalse) {
          const negated = negateSentenceIfPossible(sentence);
          if (negated) {
            statement = negated;
            correctAnswer = false;
          }
        }
        return {
          id: idBase,
          type: 'true-false',
          question: `True or False: ${statement}`,
          correctAnswer
        };
      }

      const chosenSentences = pickDistinct(sentences, Math.min(8, sentences.length));
      const questions = [];
      let qid = 1;

      // 先產生 3 題選擇題
      for (const s of chosenSentences) {
        if (questions.length >= 3) break;
        const q = buildMcqFromSentence(s, qid);
        if (q) {
          questions.push(q);
          qid++;
        }
      }

      // 再產生 1-2 題填空
      for (const s of chosenSentences) {
        if (questions.length >= 5) break;
        const q = buildFillInFromSentence(s, qid);
        if (q) {
          questions.push(q);
          qid++;
        }
      }

      // 最後產生 1 題是非
      if (chosenSentences.length > 0 && questions.length < 6) {
        const s = chosenSentences[randomInt(0, chosenSentences.length - 1)];
        questions.push(buildTrueFalseFromSentence(s, qid));
        qid++;
      }

      const finalQuestions = questions.slice(0, Math.max(5, Math.min(6, questions.length)));

      return {
        questions: finalQuestions,
        totalQuestions: finalQuestions.length,
        timeLimit: 10
      };
    } catch (e) {
      console.warn('Quiz generation failed, using fallback. Reason:', e.message);
      const questions = [
        {
          id: 1,
          type: 'true-false',
          question: 'This is a fallback question because automatic generation failed.',
          correctAnswer: true
        }
      ];
      return { questions, totalQuestions: 1, timeLimit: 5 };
    }
  }
}

export default new ArticleService();
