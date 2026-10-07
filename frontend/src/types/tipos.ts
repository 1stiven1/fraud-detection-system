export interface TransactionInput {
  transaction_id?: string;
  amount: number;
  transaction_date: string;
  transaction_time: string;
  customer_age: number;
  city: string;
  merchant_category: string;
  payment_method: string;
  recent_transactions: number;
  device_type: string;
  account_age_days: number;
  failed_attempts: number;
  usual_city: string;
  distance_from_usual_location: number;
  average_transaction_amount: number;
  transaction_frequency: number;
}

export interface RiskFactor {
  variable: string;
  label: string;
  value: string;
  impact: 'ALTO' | 'MEDIO' | 'BAJO';
  score: number;
  is_risk: boolean;
  explanation: string;
}

export interface PredictionResponse {
  prediction_id: string;
  transaction_id: string;
  fraud_probability: number;
  percentage: number;
  risk_level: 'BAJO' | 'MEDIO' | 'ALTO';
  recommendation: string;
  factors: RiskFactor[];
  model_used: string;
  timestamp: string;
}

export interface HistoryItem {
  prediction_id: string;
  transaction_id: string;
  timestamp: string;
  amount: number;
  city: string;
  merchant_category: string;
  payment_method?: string;
  fraud_probability: number;
  percentage: number;
  risk_level: 'BAJO' | 'MEDIO' | 'ALTO';
  recommendation: string;
  model_version: string;
  input_data?: TransactionInput;
  risk_factors?: RiskFactor[];
}

export interface DashboardCards {
  total_transactions: number;
  suspicious_transactions: number;
  high_risk_transactions: number;
  suspicious_amount: number;
  base_fraud_rate: number;
  live_evaluations_count: number;
}

export interface ModelMetric {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
}

export interface ModelSummary {
  selected_model: string;
  timestamp: string;
  training_samples: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
}

export interface DashboardData {
  cards: DashboardCards;
  charts: {
    fraud_by_hour: { hour: number; hour_label: string; total_transactions: number; fraud_count: number; fraud_rate: number }[];
    fraud_by_city: { city: string; total_transactions: number; fraud_count: number; fraud_rate: number }[];
    fraud_by_category: { category: string; total_transactions: number; fraud_count: number; fraud_rate: number }[];
    amount_distribution: { range: string; count: number; fraud_count: number; fraud_rate: number }[];
    risk_distribution: { name: string; count: number; color: string }[];
  };
  model_summary: ModelSummary;
  top_features: { feature: string; importance: number; percentage: number }[];
  confusion_matrix: {
    matrix: number[][];
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
}

export interface ModelComparisonData {
  timestamp: string;
  training_samples: number;
  test_samples: number;
  train_fraud_rate: number;
  test_fraud_rate: number;
  features_used: string[];
  selected_model: string;
  selection_reason: string;
  models: ModelMetric[];
}

export interface EDAFinding {
  id: number;
  title: string;
  description: string;
  evidence: Record<string, any>;
  interpretation: string;
}

export interface EDAData {
  distributions: {
    summary: {
      total_transactions: number;
      total_fraud: number;
      total_legitimate: number;
      base_fraud_rate: number;
      average_amount: number;
      median_amount: number;
      max_amount: number;
    };
    fraud_distribution: { name: string; count: number; percentage: number }[];
    fraud_by_hour: any[];
    fraud_by_city: any[];
    fraud_by_category: any[];
    fraud_by_payment: any[];
    fraud_by_device: any[];
    amount_distribution: any[];
    distance_distribution: any[];
    failed_attempts_distribution: any[];
  };
  findings: EDAFinding[];
}

export interface DataQualityReport {
  status: string;
  before: {
    records: number;
    columns: number;
    total_nulls: number;
    nulls_by_column: Record<string, number>;
    duplicate_rows: number;
    invalid_negative_amounts: number;
    outliers_detected: { amount: number; distance: number };
  };
  after: {
    records: number;
    columns: number;
    total_nulls: number;
    nulls_by_column: Record<string, number>;
    duplicate_rows: number;
    invalid_negative_amounts: number;
    outliers_detected: { amount: number; distance: number };
  };
  transformations_applied: string[];
  summary: {
    records_removed: number;
    nulls_resolved: number;
    duplicates_removed: number;
    data_health_score: number;
  };
}

export interface FeatureImportanceData {
  model: string;
  features: { feature: string; importance: number; percentage: number }[];
  raw_features: { name: string; importance: number }[];
}
