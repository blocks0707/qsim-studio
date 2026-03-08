/** Simulation provider interface — extensible for D-Wave, IBM, etc. */
export interface SimulationProvider {
  id: string;
  name: string;
  submitJob(code: string, options: SimulationOptions): Promise<JobHandle>;
  getJobStatus(jobId: string): Promise<JobStatus>;
  getJobResult(jobId: string): Promise<SimulationResult>;
  cancelJob(jobId: string): Promise<void>;
}

export interface SimulationOptions {
  language: "python" | "qasm";
  shots?: number;
  backend?: string;
}

export interface JobHandle {
  jobId: string;
  status: string;
  message?: string;
}

export interface JobStatus {
  jobId: string;
  status: "pending" | "analyzing" | "submitted" | "running" | "completed" | "failed" | "cancelled";
  progress?: number;
  error?: string;
}

export interface SimulationResult {
  jobId: string;
  counts: Record<string, number>;
  shots: number;
  metadata?: {
    qubits: number;
    depth: number;
    gateCount: number;
    executionTimeMs?: number;
  };
}

/** AI provider interface — extensible for different LLM backends */
export interface AIProvider {
  id: string;
  name: string;
  sendMessage(message: string, context?: CodeContext): Promise<AIResponse>;
}

export interface CodeContext {
  code: string;
  language: string;
  fileName: string;
  selection?: string;
}

export interface AIResponse {
  content: string;
  codeBlocks?: Array<{
    language: string;
    code: string;
  }>;
}
