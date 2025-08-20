import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ArrowLeft, Play, Trophy } from 'lucide-react';
import articleService from '../services/articleService';

const Quiz = () => {
  const { articleId } = useParams();
  const [article, setArticle] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, [articleId]);

  useEffect(() => {
    if (timeLeft > 0 && !quizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !quizCompleted) {
      submitQuiz();
    }
  }, [timeLeft, quizCompleted]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const articleData = await articleService.getArticle(articleId);
      
      if (!articleData) {
        console.error('Article not found:', articleId);
        return;
      }
      
      setArticle(articleData);
      
      const quizData = await articleService.generateQuiz(articleData.content);
      
      if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        console.error('Failed to generate quiz for article:', articleId);
        return;
      }
      
      setQuiz(quizData);
      setTimeLeft(quizData.timeLimit * 60); // 轉換為秒
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitQuiz = () => {
    if (!quiz || !quiz.questions) {
      console.error('No quiz data available');
      return;
    }
    
    let correctAnswers = 0;
    quiz.questions.forEach(question => {
      const userAnswer = answers[question.id];

      if (question.type === 'fill-in-blank') {
        const normalize = (v) =>
          String(v || '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .trim();
        if (normalize(userAnswer) === normalize(question.correctAnswer)) {
          correctAnswers++;
        }
        return;
      }

      // multiple-choice / true-false
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
    setScore(finalScore);
    setQuizCompleted(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionComponent = (question) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  answers[question.id] === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={index}
                  checked={answers[question.id] === index}
                  onChange={() => handleAnswer(question.id, index)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 border-2 rounded-full mr-3 ${
                  answers[question.id] === index
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}>
                  {answers[question.id] === index && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'fill-in-blank':
        return (
          <div>
            <input
              type="text"
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              placeholder="Type your answer..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        );

      case 'true-false':
        return (
          <div className="flex space-x-4">
            {[true, false].map((option) => (
              <label
                key={option}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  answers[question.id] === option
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={() => handleAnswer(question.id, option)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 border-2 rounded-full mr-3 ${
                  answers[question.id] === option
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}>
                  {answers[question.id] === option && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <span className="text-gray-700">{option ? 'True' : 'False'}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-6">
            {score >= 80 ? (
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            ) : score >= 60 ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            )}
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Quiz Completed!
          </h2>
          
          <div className="text-6xl font-bold text-primary-600 mb-4">
            {score}%
          </div>
          
          <p className="text-gray-600 mb-8">
            You got {Math.round((score / 100) * quiz.questions.length)} out of {quiz.questions.length} questions correct.
          </p>
          
          <div className="space-y-4">
            <Link
              to={`/article/${articleId}`}
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Review Article
            </Link>
            
            <Link
              to="/articles"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Play className="w-5 h-5 mr-2" />
              Try Another Article
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz || !article) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">Quiz not found</h2>
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

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reading Quiz</h1>
            <p className="text-gray-600">{article.title}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
            <div className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {currentQ.question}
          </h2>
          {getQuestionComponent(currentQ)}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-4">
            {currentQuestion === quiz.questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
                className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Next Question
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
