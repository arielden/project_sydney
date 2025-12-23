import React from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-navy-dark to-navy-medium text-white hover:from-navy-medium hover:to-sky-blue shadow-sm hover:shadow-card focus:ring-navy-dark',
  secondary: 'bg-sky-blue text-white hover:bg-navy-medium shadow-sm hover:shadow-card focus:ring-sky-blue',
  outline: 'border-2 border-navy-dark text-navy-dark hover:bg-navy-dark hover:text-white transition-all duration-200 focus:ring-navy-dark',
  ghost: 'text-navy-dark hover:bg-sky-blue-light transition-colors duration-200 focus:ring-navy-dark',
  accent: 'bg-yellow-accent text-navy-dark hover:bg-yellow-light font-bold shadow-sm hover:shadow-card focus:ring-yellow-accent',
  danger: 'bg-red-error text-white hover:bg-red-error hover:opacity-90 shadow-sm hover:shadow-card focus:ring-red-error',
  success: 'bg-green-success text-white hover:bg-green-success hover:opacity-90 shadow-sm hover:shadow-card focus:ring-green-success',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  as?: 'button' | typeof Link;
  to?: string;
  href?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      as: Component = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];
    const widthStyle = fullWidth ? 'w-full' : '';
    const combinedClassName = `${baseStyles} ${variantStyle} ${sizeStyle} ${widthStyle} ${className || ''}`.trim();

    if (Component === Link) {
      return <Link className={combinedClassName} {...(props as any)} />;
    }

    return (
      <button
        className={combinedClassName}
        ref={ref}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
