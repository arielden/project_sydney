import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  link?: string;
  backgroundColor?: 'cream' | 'purple-light' | 'rose-light';
  iconText?: string;
  isExternal?: boolean;
  disabled?: boolean;
}

const Card = ({ 
  title, 
  description, 
  icon: Icon, 
  link, 
  backgroundColor = 'cream',
  iconText,
  isExternal = false,
  disabled = false
}: CardProps) => {
  const getBackgroundClass = () => {
    switch (backgroundColor) {
      case 'purple-light':
        return 'bg-purple-light';
      case 'rose-light':
        return 'bg-rose-light';
      default:
        return 'bg-cream';
    }
  };

  const CardContent = () => (
    <div className={`
      ${getBackgroundClass()} 
      p-6 rounded-xl shadow-card transition-all duration-300
      border border-gray-100 h-full flex flex-col
      ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-card-hover transform hover:-translate-y-1'}
    `}>
      {/* Icon Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Icon className="h-6 w-6 text-blue-primary" />
          </div>
          {iconText && (
            <span className="text-sm text-gray-600 font-medium">{iconText}</span>
          )}
        </div>
        {(link || isExternal) && (
          <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-blue-primary transition-colors duration-200" />
        )}
      </div>

      {/* Content */}
      <div className="flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-700 leading-relaxed">{description}</p>
      </div>
    </div>
  );

  if (link && !disabled) {
    if (isExternal) {
      return (
        <a 
          href={link} 
          className="group block h-full"
          target="_blank"
          rel="noopener noreferrer"
        >
          <CardContent />
        </a>
      );
    }
    
    return (
      <Link 
        to={link} 
        className="group block h-full"
      >
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
};

export default Card;