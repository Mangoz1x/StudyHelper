/**
 * Empty State Component
 *
 * Displays a placeholder when there's no content
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className = '',
}) {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
            {Icon && (
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
            )}
            {title && (
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {title}
                </h3>
            )}
            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
