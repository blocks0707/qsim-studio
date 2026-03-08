import * as vscode from "vscode";
import {
  SimulationProvider,
  SimulationOptions,
  JobHandle,
  JobStatus,
  SimulationResult,
} from "./types";

export class QSimProvider implements SimulationProvider {
  readonly id = "qsim-cluster";
  readonly name = "QSim Cluster";

  private getConfig() {
    const config = vscode.workspace.getConfiguration("qsim");
    const apiUrl = config.get<string>("apiUrl", "http://localhost:8080");
    const apiToken = config.get<string>("apiToken", "");
    return { apiUrl: apiUrl.replace(/\/+$/, ""), apiToken };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const { apiUrl, apiToken } = this.getConfig();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiToken) {
      headers["Authorization"] = `Bearer ${apiToken}`;
    }

    const url = `${apiUrl}${path}`;
    const resp = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`API ${method} ${path} failed (${resp.status}): ${text}`);
    }

    if (resp.status === 204) {
      return undefined as T;
    }
    return resp.json() as Promise<T>;
  }

  async submitJob(code: string, options: SimulationOptions): Promise<JobHandle> {
    return this.request<JobHandle>("POST", "/api/v1/jobs", {
      code,
      language: options.language,
      shots: options.shots,
      backend: options.backend,
    });
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    return this.request<JobStatus>("GET", `/api/v1/jobs/${jobId}`);
  }

  async getJobResult(jobId: string): Promise<SimulationResult> {
    return this.request<SimulationResult>(
      "GET",
      `/api/v1/jobs/${jobId}/result`
    );
  }

  async cancelJob(jobId: string): Promise<void> {
    await this.request<void>("DELETE", `/api/v1/jobs/${jobId}`);
  }

  isConfigured(): boolean {
    const { apiUrl } = this.getConfig();
    return !!apiUrl;
  }
}
