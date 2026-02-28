import { AssetType, JobStatus } from './enums';

export type AiRoute =
  | 'generation_critique'
  | 'reasoning_fallback'
  | 'multilingual'
  | 'preview_fast'
  | 'edge_light';

export interface AiModelConfig {
  route: AiRoute;
  modelId: string;
  quantization: 'Q4_K_M' | 'Q5_K_M' | 'Q8_0' | 'AUTO';
}

export interface AiJobRequest {
  assetType: AssetType;
  prompt: string;
  context: Record<string, unknown>;
  preferredRoute?: AiRoute;
}

export interface AiJobResult {
  jobId: string;
  status: JobStatus;
  content?: string;
  routeUsed: AiRoute;
  modelId: string;
  fallbackUsed: boolean;
}

