import React, { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Toast, ToastType } from '../../types';
import { generateId } from '../../utils';

// Toast Context
interface ToastContextType {
    toasts: Toast[];
    addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback(
        (type: ToastType, title: string, message?: string, duration = 5000) => {
            const id = generateId();
            setToasts((prev) => [...prev, { id, type, title, message, duration }]);
        },
        []
    );

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Toast Container Component
function ToastContainer() {
    const { toasts } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
}

// Individual Toast Component
function ToastItem({ toast }: { toast: Toast }) {
    const { removeToast } = useToast();
    const [isExiting, setIsExiting] = useState(false);

    const handleRemove = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => removeToast(toast.id), 200);
    }, [removeToast, toast.id]);

    useEffect(() => {
        if (toast.duration) {
            const timer = setTimeout(handleRemove, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, handleRemove]);

    const icons: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle2 className="w-5 h-5 text-success-400" />,
        error: <AlertCircle className="w-5 h-5 text-error-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-warning-400" />,
        info: <Info className="w-5 h-5 text-accent-400" />,
    };

    const bgColors: Record<ToastType, string> = {
        success: 'border-success-500/30 bg-success-500/10',
        error: 'border-error-500/30 bg-error-500/10',
        warning: 'border-warning-500/30 bg-warning-500/10',
        info: 'border-accent-500/30 bg-accent-500/10',
    };

    return (
        <div
            className={`glass border ${bgColors[toast.type]} rounded-xl p-4 pr-10 min-w-[300px] max-w-md shadow-lg transform transition-all duration-200 ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                }`}
        >
            <button
                onClick={handleRemove}
                className="absolute top-3 right-3 p-1 rounded-lg hover:bg-surface-700 transition-colors"
            >
                <X className="w-4 h-4 text-surface-400" />
            </button>

            <div className="flex gap-3">
                <div className="flex-shrink-0">{icons[toast.type]}</div>
                <div>
                    <p className="font-medium text-white">{toast.title}</p>
                    {toast.message && (
                        <p className="mt-1 text-sm text-surface-400">{toast.message}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ToastProvider;

