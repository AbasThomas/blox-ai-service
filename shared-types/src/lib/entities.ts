import { AssetType, BillingCycle, JobStatus, PlanTier, Visibility } from './enums';

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PricingPlan {
  tier: PlanTier;
  cycle: BillingCycle;
  amountUsd: number;
  display: string;
  discountPct: number;
  isTrialEligible: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  tier: PlanTier;
  persona: 'Freelancer' | 'JobSeeker' | 'Professional' | 'Enterprise' | 'Student';
  mfaEnabled: boolean;
}

export interface AssetSummary {
  id: string;
  type: AssetType;
  title: string;
  healthScore: number;
  visibility: Visibility;
  updatedAt: string;
}

export interface JobProgress {
  id: string;
  status: JobStatus;
  progressPct: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

