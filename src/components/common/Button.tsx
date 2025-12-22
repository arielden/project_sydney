import React from 'react';
import { Link } from 'react-router-dom';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-navy-dark to-navy-medium text-white hover:from-navy-medium hover:to-sky-blue shadow-sm hover:shadow-card focus:ring-navy-dark',
        secondary: 'bg-sky-blue text-white hover:bg-navy-medium shadow-sm hover:shadow-card focus:ring-sky-blue',
        outline: 'border-2 border-navy-dark text-navy-dark hover:bg-navy-dark hover:text-white transition-all duration-200 focus:ring-navy-dark',
        ghost: 'text-navy-dark hover:bg-sky-blue-light transition-colors duration-200 focus:ring-navy-dark',
        accent: 'bg-yellow-accent text-navy-dark hover:bg-yellow-light font-bold shadow-sm hover:shadow-card focus:ring-yellow-accent',
        danger: 'bg-red-error text-white hover:bg-red-error hover:opacity-90 shadow-sm hover:shadow-card focus:ring-red-error',
        success: 'bg-green-success text-white hover:bg-green-success hover:opacity-90 shadow-sm hover:shadow-card focus:ring-green-success',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  as?: 'button' | typeof Link;
  to?: string;
  href?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, as: Component = 'button', ...props }, ref) => {
    const buttonClass = buttonVariants({ variant, size, fullWidth, className });

    if (Component === Link) {
      return <Link className={buttonClass} {...(props as any)} />;
    }

    return (
      <button
        className={buttonClass}
        ref={ref}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
