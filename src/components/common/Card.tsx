import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type CardVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'outline';

const variantStyles: Record<CardVariant, { container: string; title: string; description: string; icon: string }> = {
  default: {
    container: 'bg-white border-gray-200 shadow-card hover:shadow-card-hover hover:-translate-y-1',
    title: 'text-gray-900',
    description: 'text-gray-700',
    icon: 'text-navy-dark',
  },
  primary: {
    container: 'bg-gradient-to-br from-navy-dark to-navy-medium border-navy-medium shadow-card hover:shadow-card-hover hover:-translate-y-1',
    title: 'text-white',
    description: 'text-sky-blue-light',
    icon: 'text-white',
  },
  secondary: {
    container: 'bg-sky-blue-light border-sky-blue shadow-card hover:shadow-card-hover hover:-translate-y-1',
    title: 'text-gray-900',
    description: 'text-gray-700',
    icon: 'text-navy-dark',
  },
  accent: {
    container: 'bg-gradient-to-br from-yellow-accent to-yellow-light border-yellow-accent shadow-card hover:shadow-card-hover hover:-translate-y-1',
    title: 'text-navy-dark',
    description: 'text-navy-dark',
    icon: 'text-navy-dark',
  },
  outline: {
    container: 'bg-white border-navy-dark shadow-card hover:shadow-card-hover hover:-translate-y-1',
    title: 'text-gray-900',
    description: 'text-gray-700',
    icon: 'text-navy-dark',
  },
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  link?: string;
  variant?: CardVariant;
  isExternal?: boolean;
  disabled?: boolean;
  iconText?: string;
}

const Card = ({
  title,
  description,
  icon: Icon,
  link,
  variant = 'default',
  iconText,
  isExternal = false,
  disabled = false,
  className,
  ...props
}: CardProps) => {
  const styles = variantStyles[variant];

  const CardContent = () => (
    <div className={`rounded-lg border transition-all duration-300 h-full flex flex-col overflow-hidden ${styles.container} ${className || ''}`.trim()} {...props}>
      {/* Icon Section */}
      <div className="p-6 flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className={`p-3 rounded-lg ${variant === 'primary' ? 'bg-sky-blue' : variant === 'accent' ? 'bg-navy-dark' : 'bg-sky-blue-light'}`}>
              <Icon className={`h-6 w-6 ${variant === 'primary' || variant === 'accent' ? 'text-white' : styles.icon}`} />
            </div>
          )}
          {iconText && (
            <span className={`text-sm font-medium ${variant === 'primary' ? 'text-sky-blue-light' : 'text-gray-600'}`}>{iconText}</span>
          )}
        </div>
        {(link || isExternal) && !disabled && (
          <ArrowUpRight className={`h-5 w-5 transition-colors duration-200 ${variant === 'primary' ? 'text-sky-blue-light' : 'text-navy-dark'}`} />
        )}
      </div>

      {/* Content */}
      <div className="px-6 pb-6 flex-grow">
        <h3 className={`text-lg font-bold mb-2 ${styles.title}`}>{title}</h3>
        <p className={`leading-relaxed ${styles.description}`}>{description}</p>
      </div>
    </div>
  );

  if (link && !disabled) {
    if (isExternal) {
      return (
        <a href={link} className="group block h-full" target="_blank" rel="noopener noreferrer">
          <CardContent />
        </a>
      );
    }

    return (
      <Link to={link} className="group block h-full">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
};

export default Card;