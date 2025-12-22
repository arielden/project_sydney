import { Link } from 'react-router-dom';
import { Mail, Linkedin, Twitter, Github } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-dark text-gray-100 pt-16 pb-8 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className="text-2xl font-bold bg-gradient-to-r from-yellow-accent to-yellow-light bg-clip-text text-transparent hover:from-yellow-light hover:to-yellow-accent transition-all duration-200"
            >
              Sopharium
            </Link>
            <p className="text-gray-400 leading-relaxed">
              Adaptive SAT math preparation platform using ELO-based difficulty scaling.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-accent transition-colors duration-200 p-2 hover:bg-gray-700 rounded-lg"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-accent transition-colors duration-200 p-2 hover:bg-gray-700 rounded-lg"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-accent transition-colors duration-200 p-2 hover:bg-gray-700 rounded-lg"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="mailto:info@sopharium.com"
                className="text-gray-400 hover:text-yellow-accent transition-colors duration-200 p-2 hover:bg-gray-700 rounded-lg"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <a href="#features" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="#blog" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  Blog
                </a>
              </li>
              <li>
                <a href="#guides" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  Study Guides
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#support" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <a href="#privacy" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#cookies" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} Sopharium. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#status" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200 text-sm">
              System Status
            </a>
            <a href="#changelog" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200 text-sm">
              Changelog
            </a>
            <a href="#security" className="text-gray-400 hover:text-yellow-accent transition-colors duration-200 text-sm">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
