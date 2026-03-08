import { QSimProvider } from '../providers/qsimProvider';

// Mock vscode before importing
jest.mock('vscode', () => ({
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'apiUrl') return 'http://test-api:8080';
        if (key === 'apiToken') return 'test-token';
        return defaultValue;
      }),
    })),
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('QSimProvider', () => {
  let provider: QSimProvider;

  beforeEach(() => {
    provider = new QSimProvider();
    mockFetch.mockReset();
  });

  describe('submitJob', () => {
    test('succeeds with valid response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ jobId: 'job-123', status: 'pending' }),
      });

      const result = await provider.submitJob('h q[0];', { language: 'qasm', shots: 1024 });
      expect(result).toEqual({ jobId: 'job-123', status: 'pending' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api:8080/api/v1/jobs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        }),
      );
    });

    test('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(provider.submitJob('bad', { language: 'qasm' }))
        .rejects.toThrow('API POST /api/v1/jobs failed (500)');
    });
  });

  describe('getJobStatus', () => {
    const statuses = ['pending', 'analyzing', 'submitted', 'running', 'completed', 'failed', 'cancelled'] as const;

    statuses.forEach((status) => {
      test(`returns ${status} status`, async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ jobId: 'job-1', status }),
        });

        const result = await provider.getJobStatus('job-1');
        expect(result.status).toBe(status);
      });
    });
  });

  describe('getJobResult', () => {
    test('parses result with counts', async () => {
      const mockResult = {
        jobId: 'job-1',
        counts: { '00': 512, '11': 512 },
        shots: 1024,
        metadata: { qubits: 2, depth: 3, gateCount: 4 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResult),
      });

      const result = await provider.getJobResult('job-1');
      expect(result.counts).toEqual({ '00': 512, '11': 512 });
      expect(result.shots).toBe(1024);
    });
  });

  describe('cancelJob', () => {
    test('sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await provider.cancelJob('job-1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api:8080/api/v1/jobs/job-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('isConfigured', () => {
    test('returns true when apiUrl is set', () => {
      expect(provider.isConfigured()).toBe(true);
    });
  });
});
