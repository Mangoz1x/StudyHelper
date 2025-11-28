import { User } from 'lucide-react';

/**
 * Avatar Component
 *
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for image
 * @param {string} props.name - Name for fallback initials
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl'} props.size - Avatar size
 */
const Avatar = ({
    src,
    alt,
    name,
    size = 'md',
    className = '',
    ...props
}) => {
    const sizes = {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
    };

    const iconSizes = {
        xs: 12,
        sm: 14,
        md: 18,
        lg: 22,
        xl: 28,
    };

    const getInitials = (name) => {
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0]?.toUpperCase() || '';
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const initials = getInitials(name);

    return (
        <div
            className={`
                relative inline-flex items-center justify-center
                rounded-full overflow-hidden
                bg-gray-100 dark:bg-gray-800
                ${sizes[size]}
                ${className}
            `.trim()}
            {...props}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt || name || 'Avatar'}
                    className="h-full w-full object-cover"
                />
            ) : initials ? (
                <span className="font-medium text-gray-600 dark:text-gray-300">
                    {initials}
                </span>
            ) : (
                <User
                    size={iconSizes[size]}
                    className="text-gray-400 dark:text-gray-500"
                    aria-hidden="true"
                />
            )}
        </div>
    );
};

export { Avatar };
