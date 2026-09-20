export type TransactionType = 'expense' | 'income';

export interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  categoryName?: string;
  type: TransactionType;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodSummary {
  from?: string;
  to?: string;
  type?: TransactionType;
  totalIncome: number;
  totalExpense: number;
  net: number;
  count: number;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionBody {
  categoryId: string;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string | null;
}

export interface ParsedTransaction {
  amount: number;
  description: string;
  type: 'expense';
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export type ApiErrorKind = 'network' | 'http' | 'auth';
