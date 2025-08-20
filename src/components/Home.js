import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, Target, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          AI-Powered Reading
          <span className="text-primary-600"> Comprehension</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Practice your English reading skills with interactive AI-generated quizzes 
          based on real articles from Offbeat English.
        </p>
        <Link
          to="/articles"
          className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          Start Reading
        </Link>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <Brain className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI-Generated Quizzes</h3>
          <p className="text-gray-600">
            Each article comes with automatically generated comprehension questions 
            tailored to test your understanding.
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <Target className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
          <p className="text-gray-600">
            Monitor your reading comprehension skills with detailed performance 
            analytics and progress tracking.
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Real Content</h3>
          <p className="text-gray-600">
            Practice with authentic English articles from Offbeat English, 
            featuring interesting and engaging topics.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
              1
            </div>
            <h3 className="font-semibold mb-2">Choose an Article</h3>
            <p className="text-gray-600">Browse our collection of articles from Offbeat English</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
              2
            </div>
            <h3 className="font-semibold mb-2">Read & Learn</h3>
            <p className="text-gray-600">Read the article at your own pace and understand the content</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
              3
            </div>
            <h3 className="font-semibold mb-2">Take the Quiz</h3>
            <p className="text-gray-600">Test your comprehension with AI-generated questions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
