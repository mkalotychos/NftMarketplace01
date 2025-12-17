import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'primary' | 'accent' | 'white';
    className?: string;
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16',
};

const colorClasses = {
    primary: 'text-primary-500',
    accent: 'text-accent-500',
    white: 'text-white',
};

export function LoadingSpinner({
    size = 'md',
    color = 'primary',
    className = '',
}: LoadingSpinnerProps) {
    return (
        <Loader2
            className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
        />
    );
}

// Full page loading state
export function PageLoader() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="xl" />
                <p className="mt-4 text-surface-400">Loading...</p>
            </div>
        </div>
    );
}

export default LoadingSpinner;

