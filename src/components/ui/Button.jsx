'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 *
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'danger'} props.variant - Button style variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.fullWidth - Make button full width
 * @param {React.ReactNode} props.leftIcon - Icon to show on the left
 * @param {React.ReactNode} props.rightIcon - Icon to show on the right
 */
const Button = forwardRef(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            loading = false,
            disabled = false,
            fullWidth = false,
            leftIcon,
            rightIcon,
            className = '',
            type = 'button',
            ...props
        },
        ref
    ) => {
        const baseStyles = `
            inline-flex items-center justify-center font-medium
            rounded-lg transition-all duration-150 ease-out
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            disabled:opacity-50 disabled:pointer-events-none
        `;

        const variants = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500 shadow-sm',
            secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-blue-500',
            ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-blue-500',
            danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-sm',
        };

        const sizes = {
            sm: 'h-8 px-3 text-sm gap-1.5',
            md: 'h-10 px-4 text-sm gap-2',
            lg: 'h-12 px-6 text-base gap-2.5',
        };

        const iconSizes = {
            sm: 14,
            md: 16,
            lg: 18,
        };

        return (
            <button
                ref={ref}
                type={type}
                disabled={disabled || loading}
                className={`
                    ${baseStyles}
                    ${variants[variant]}
                    ${sizes[size]}
                    ${fullWidth ? 'w-full' : ''}
                    ${className}
                `.trim()}
                {...props}
            >
                {loading ? (
                    <Loader2
                        size={iconSizes[size]}
                        className="animate-spin"
                        aria-hidden="true"
                    />
                ) : (
                    leftIcon
                )}
                {children}
                {!loading && rightIcon}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
