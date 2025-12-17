import React, {
    createContext,
    useContext,
    useReducer,
    useCallback,
    ReactNode,
} from 'react';
import type { Transaction, TransactionStatus } from '../types';
import { generateId } from '../utils';

interface TransactionState {
    transactions: Transaction[];
    pendingCount: number;
}

type TransactionAction =
    | { type: 'ADD_TRANSACTION'; payload: Transaction }
    | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
    | { type: 'REMOVE_TRANSACTION'; payload: string }
    | { type: 'CLEAR_COMPLETED' };

interface TransactionContextType extends TransactionState {
    addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => string;
    updateTransaction: (id: string, updates: Partial<Transaction>) => void;
    removeTransaction: (id: string) => void;
    clearCompleted: () => void;
    getTransaction: (id: string) => Transaction | undefined;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

const initialState: TransactionState = {
    transactions: [],
    pendingCount: 0,
};

function transactionReducer(
    state: TransactionState,
    action: TransactionAction
): TransactionState {
    switch (action.type) {
        case 'ADD_TRANSACTION': {
            const newTransactions = [action.payload, ...state.transactions];
            const pendingCount = newTransactions.filter(
                (tx) => tx.status === 'pending' || tx.status === 'confirming'
            ).length;

            return {
                ...state,
                transactions: newTransactions,
                pendingCount,
            };
        }

        case 'UPDATE_TRANSACTION': {
            const newTransactions = state.transactions.map((tx) =>
                tx.id === action.payload.id
                    ? { ...tx, ...action.payload.updates }
                    : tx
            );
            const pendingCount = newTransactions.filter(
                (tx) => tx.status === 'pending' || tx.status === 'confirming'
            ).length;

            return {
                ...state,
                transactions: newTransactions,
                pendingCount,
            };
        }

        case 'REMOVE_TRANSACTION': {
            const newTransactions = state.transactions.filter(
                (tx) => tx.id !== action.payload
            );
            const pendingCount = newTransactions.filter(
                (tx) => tx.status === 'pending' || tx.status === 'confirming'
            ).length;

            return {
                ...state,
                transactions: newTransactions,
                pendingCount,
            };
        }

        case 'CLEAR_COMPLETED': {
            const newTransactions = state.transactions.filter(
                (tx) => tx.status === 'pending' || tx.status === 'confirming'
            );

            return {
                ...state,
                transactions: newTransactions,
                pendingCount: newTransactions.length,
            };
        }

        default:
            return state;
    }
}

interface TransactionProviderProps {
    children: ReactNode;
}

export function TransactionProvider({ children }: TransactionProviderProps) {
    const [state, dispatch] = useReducer(transactionReducer, initialState);

    const addTransaction = useCallback(
        (tx: Omit<Transaction, 'id' | 'timestamp'>): string => {
            const id = generateId();
            const transaction: Transaction = {
                ...tx,
                id,
                timestamp: Date.now(),
            };

            dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
            return id;
        },
        []
    );

    const updateTransaction = useCallback(
        (id: string, updates: Partial<Transaction>) => {
            dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, updates } });
        },
        []
    );

    const removeTransaction = useCallback((id: string) => {
        dispatch({ type: 'REMOVE_TRANSACTION', payload: id });
    }, []);

    const clearCompleted = useCallback(() => {
        dispatch({ type: 'CLEAR_COMPLETED' });
    }, []);

    const getTransaction = useCallback(
        (id: string): Transaction | undefined => {
            return state.transactions.find((tx) => tx.id === id);
        },
        [state.transactions]
    );

    const value: TransactionContextType = {
        ...state,
        addTransaction,
        updateTransaction,
        removeTransaction,
        clearCompleted,
        getTransaction,
    };

    return (
        <TransactionContext.Provider value={value}>
            {children}
        </TransactionContext.Provider>
    );
}

export function useTransactionContext(): TransactionContextType {
    const context = useContext(TransactionContext);

    if (!context) {
        throw new Error(
            'useTransactionContext must be used within a TransactionProvider'
        );
    }

    return context;
}

// Helper hook for tracking a specific transaction
export function useTrackTransaction(txId: string | null) {
    const { getTransaction } = useTransactionContext();

    if (!txId) {
        return {
            status: 'idle' as TransactionStatus,
            hash: null,
            error: null,
        };
    }

    const tx = getTransaction(txId);

    return {
        status: tx?.status || 'idle',
        hash: tx?.hash || null,
        error: tx?.error || null,
    };
}

export default TransactionContext;

