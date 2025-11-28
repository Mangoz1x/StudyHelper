'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal should close
 * @param {string} [props.title] - Modal title
 * @param {string} [props.size] - Modal size ('sm' | 'md' | 'lg' | 'xl')
 */
export function Modal({
    open,
    onClose,
    title,
    children,
    size = 'md',
    className = '',
}) {
    const overlayRef = useRef(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (open) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    // Close on overlay click
    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) {
            onClose();
        }
    };

    if (!open) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
            <div
                className={`
                    w-full ${sizes[size]} bg-white rounded-2xl shadow-xl
                    animate-in zoom-in-95 slide-in-from-bottom-4 duration-200
                    ${className}
                `.trim()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <h2
                            id="modal-title"
                            className="text-lg font-semibold text-gray-900"
                        >
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className={title ? '' : 'pt-6'}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export function ModalBody({ children, className = '' }) {
    return (
        <div className={`px-6 py-4 ${className}`}>
            {children}
        </div>
    );
}

export function ModalFooter({ children, className = '' }) {
    return (
        <div className={`px-6 py-4 border-t border-gray-200 flex justify-end gap-3 ${className}`}>
            {children}
        </div>
    );
}
