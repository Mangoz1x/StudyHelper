/**
 * Card Component
 *
 * @param {Object} props
 * @param {'default' | 'elevated' | 'interactive' | 'glass'} props.variant - Card style variant
 * @param {'none' | 'sm' | 'md' | 'lg'} props.padding - Padding size
 */
const Card = ({
    children,
    variant = 'default',
    padding = 'md',
    className = '',
    ...props
}) => {
    const baseStyles = 'rounded-2xl transition-all duration-200';

    const variants = {
        default: 'bg-white border border-gray-200 shadow-sm',
        elevated: 'bg-white shadow-md hover:shadow-lg',
        interactive: 'bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 cursor-pointer',
        glass: 'bg-white/80 backdrop-blur-lg border border-white/20 shadow-lg',
    };

    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={`
                ${baseStyles}
                ${variants[variant]}
                ${paddings[padding]}
                ${className}
            `.trim()}
            {...props}
        >
            {children}
        </div>
    );
};

const CardHeader = ({ children, className = '', ...props }) => (
    <div className={`mb-4 ${className}`} {...props}>
        {children}
    </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
    <h3
        className={`text-lg font-semibold text-gray-900 ${className}`}
        {...props}
    >
        {children}
    </h3>
);

const CardDescription = ({ children, className = '', ...props }) => (
    <p
        className={`text-sm text-gray-500 mt-1 ${className}`}
        {...props}
    >
        {children}
    </p>
);

const CardContent = ({ children, className = '', ...props }) => (
    <div className={className} {...props}>
        {children}
    </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
    <div
        className={`mt-6 pt-4 border-t border-gray-200 ${className}`}
        {...props}
    >
        {children}
    </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
