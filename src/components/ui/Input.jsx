'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Input Component
 *
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.hint - Helper text
 * @param {React.ReactNode} props.leftIcon - Icon on the left
 * @param {React.ReactNode} props.rightIcon - Icon on the right
 */
const Input = forwardRef(
    (
        {
            label,
            error,
            hint,
            leftIcon,
            rightIcon,
            type = 'text',
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        type={inputType}
                        className={`
                            block w-full rounded-lg border bg-white
                            px-4 py-2.5 text-gray-900 placeholder:text-gray-400
                            transition-colors duration-150
                            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                            ${leftIcon ? 'pl-10' : ''}
                            ${rightIcon || isPassword ? 'pr-10' : ''}
                            ${
                                error
                                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                                    : 'border-gray-300'
                            }
                            ${className}
                        `.trim()}
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}
                    {rightIcon && !isPassword && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p
                        id={`${inputId}-error`}
                        className="mt-1.5 text-sm text-red-600"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p
                        id={`${inputId}-hint`}
                        className="mt-1.5 text-sm text-gray-500"
                    >
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
