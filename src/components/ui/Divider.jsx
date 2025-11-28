/**
 * Divider Component
 *
 * Horizontal divider with optional text label
 */
const Divider = ({ children, className = '', ...props }) => {
    if (children) {
        return (
            <div className={`relative my-6 ${className}`} {...props}>
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center">
                    <span className="px-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
                        {children}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`border-t border-gray-200 dark:border-gray-700 my-6 ${className}`}
            {...props}
        />
    );
};

export { Divider };
