import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import ArticleList from './components/ArticleList';
import ArticleReader from './components/ArticleReader';
import Quiz from './components/Quiz';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/articles" element={<ArticleList />} />
            <Route path="/article/:id" element={<ArticleReader />} />
            <Route path="/quiz/:articleId" element={<Quiz />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
