import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
}

export function EmptyState({
    icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-surface-800 flex items-center justify-center mb-6">
                {icon || <Package className="w-10 h-10 text-surface-500" />}
            </div>

            <h3 className="text-xl font-display font-semibold text-white mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-surface-400 max-w-sm mb-6">{description}</p>
            )}

            {action && (
                action.href ? (
                    <Link to={action.href} className="btn-primary">
                        <Plus className="w-5 h-5" />
                        {action.label}
                    </Link>
                ) : (
                    <button onClick={action.onClick} className="btn-primary">
                        <Plus className="w-5 h-5" />
                        {action.label}
                    </button>
                )
            )}
        </div>
    );
}

export default EmptyState;

