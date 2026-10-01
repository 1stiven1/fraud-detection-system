import axios from 'axios';
import {
  TransactionInput,
  PredictionResponse,
  HistoryItem,
  DashboardData,
  ModelComparisonData,
  DataQualityReport,
  EDAData,
  FeatureImportanceData
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fraudApi = {
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  getDashboard: async (): Promise<DashboardData> => {
    const res = await api.get<DashboardData>('/dashboard');
    return res.data;
  },

  predict: async (data: TransactionInput): Promise<PredictionResponse> => {
    const res = await api.post<PredictionResponse>('/predict', data);
    return res.data;
  },

  getHistory: async (params?: {
    search?: string;
    risk_level?: string;
    sort_by?: string;
    order?: string;
    limit?: number;
  }): Promise<HistoryItem[]> => {
    const res = await api.get<HistoryItem[]>('/history', { params });
    return res.data;
  },

  getHistoryDetail: async (predictionId: string): Promise<HistoryItem> => {
    const res = await api.get<HistoryItem>(`/history/${predictionId}`);
    return res.data;
  },

  getModels: async (): Promise<{ comparison: ModelComparisonData; confusion_matrices: Record<string, any> }> => {
    const res = await api.get('/models');
    return res.data;
  },

  getDataQuality: async (): Promise<DataQualityReport> => {
    const res = await api.get<DataQualityReport>('/data-quality');
    return res.data;
  },

  getEDA: async (): Promise<EDAData> => {
    const res = await api.get<EDAData>('/eda');
    return res.data;
  },

  getFeatureImportance: async (): Promise<FeatureImportanceData> => {
    const res = await api.get<FeatureImportanceData>('/feature-importance');
    return res.data;
  },

  getConfusionMatrix: async (): Promise<Record<string, any>> => {
    const res = await api.get('/confusion-matrix');
    return res.data;
  },

  getTransactions: async (limit: number = 20, fraudOnly: boolean = false): Promise<any[]> => {
    const res = await api.get('/transactions', { params: { limit, fraud_only: fraudOnly } });
    return res.data;
  },

  triggerRetrain: async (): Promise<any> => {
    const res = await api.post('/train');
    return res.data;
  },
};
