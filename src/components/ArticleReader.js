import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, BookOpen, Play, ArrowLeft } from 'lucide-react';
import articleService from '../services/articleService';
import DOMPurify from 'dompurify';

const ArticleReader = () => {
  const { id: rawId } = useParams();
  const id = decodeURIComponent(rawId || '');
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const data = await articleService.getArticle(id);
      setArticle(data);
      if (data) {
        // 估算閱讀時間（假設每分鐘200字）
        const estimatedTime = Math.ceil(data.wordCount / 200);
        setReadingTime(estimatedTime);
      }
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">Article not found</h2>
        <Link
          to="/articles"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Articles
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="mb-6">
        <Link
          to="/articles"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Articles
        </Link>
      </div>

      {/* Article Header */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
            article.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
            article.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {article.difficulty}
          </span>
          <div className="flex items-center space-x-4 text-gray-500 text-sm">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {article.date}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {readingTime} min read
            </div>
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {article.wordCount} words
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>

        <p className="text-xl text-gray-600 mb-6">
          {article.excerpt}
        </p>

        <div className="border-t pt-6">
          <Link
            to={`/quiz/${article.id}`}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Take Reading Quiz
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="prose prose-lg max-w-none">
          {/* 若有乾淨 HTML，優先渲染，移除圖片與行內樣式 */}
          {article.contentHtml ? (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  (article.contentHtml || '')
                    .replace(/<img[^>]*>/gi, '') // 移除所有圖片
                    .replace(/ style="[^"]*"/gi, '') // 移除行內樣式
                    .replace(/<figure[\s\S]*?<\/figure>/gi, '') // 移除 figure
                    .replace(/<script[\s\S]*?<\/script>/gi, '') // 移除 script
                    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '') // 移除 iframe
                )
              }}
            />
          ) : (
            article.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph.trim()}
              </p>
            ))
          )}
        </div>

        {/* Quiz CTA */}
        <div className="mt-12 p-6 bg-primary-50 rounded-lg text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ready to test your comprehension?
          </h3>
          <p className="text-gray-600 mb-4">
            Take our AI-generated quiz to see how well you understood this article.
          </p>
          <Link
            to={`/quiz/${article.id}`}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Quiz
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ArticleReader;
