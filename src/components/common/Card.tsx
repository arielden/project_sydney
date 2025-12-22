import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-lg border transition-all duration-300 h-full flex flex-col overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200 shadow-card hover:shadow-card-hover hover:-translate-y-1',
        primary: 'bg-gradient-to-br from-navy-dark to-navy-medium border-navy-medium shadow-card hover:shadow-card-hover hover:-translate-y-1',
        secondary: 'bg-sky-blue-light border-sky-blue shadow-card hover:shadow-card-hover hover:-translate-y-1',
        accent: 'bg-gradient-to-br from-yellow-accent to-yellow-light border-yellow-accent shadow-card hover:shadow-card-hover hover:-translate-y-1',
        outline: 'bg-white border-navy-dark shadow-card hover:shadow-card-hover hover:-translate-y-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  link?: string;
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
  const textColorClass = variant === 'primary' || variant === 'accent' ? 'text-white' : 'text-gray-900';
  const descriptionColorClass = variant === 'primary' ? 'text-sky-blue-light' : variant === 'accent' ? 'text-navy-dark' : 'text-gray-700';

  const CardContent = () => (
    <div className={cardVariants({ variant, className })} {...props}>
      {/* Icon Section */}
      <div className="p-6 flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className={`p-3 rounded-lg ${variant === 'primary' ? 'bg-sky-blue' : variant === 'accent' ? 'bg-navy-dark' : 'bg-sky-blue-light'}`}>
              <Icon className={`h-6 w-6 ${variant === 'primary' || variant === 'accent' ? 'text-white' : 'text-navy-dark'}`} />
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
        <h3 className={`text-lg font-bold mb-2 ${textColorClass}`}>{title}</h3>
        <p className={`leading-relaxed ${descriptionColorClass}`}>{description}</p>
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
export { cardVariants };