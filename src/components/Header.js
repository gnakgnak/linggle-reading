import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Home, List } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-primary-600">
            <BookOpen className="w-8 h-8" />
            <span>Linggle Reading</span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link 
              to="/articles" 
              className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <List className="w-4 h-4" />
              <span>Articles</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
