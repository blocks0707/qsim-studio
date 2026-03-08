import * as fs from 'fs';
import * as path from 'path';

// Load algorithms.json directly (avoid vscode dependency in registry provider)
const algorithmsPath = path.resolve(__dirname, '../registry/algorithms.json');
const algorithms = JSON.parse(fs.readFileSync(algorithmsPath, 'utf-8')) as Array<{
  id: string;
  name: string;
  category: string;
  description: string;
  qubits: number;
  difficulty: string;
  tags: string[];
}>;

describe('Algorithm Registry', () => {
  test('loads algorithms.json', () => {
    expect(algorithms).toBeInstanceOf(Array);
    expect(algorithms.length).toBeGreaterThan(0);
  });

  test('every algorithm has required fields', () => {
    for (const alg of algorithms) {
      expect(alg.id).toBeTruthy();
      expect(alg.name).toBeTruthy();
      expect(alg.category).toBeTruthy();
      expect(alg.description).toBeTruthy();
      expect(typeof alg.qubits).toBe('number');
      expect(alg.difficulty).toBeTruthy();
      expect(alg.tags).toBeInstanceOf(Array);
    }
  });

  test('categories are correctly classified', () => {
    const categories = [...new Set(algorithms.map((a) => a.category))];
    expect(categories).toContain('fundamentals');
    expect(categories).toContain('search');
    expect(categories).toContain('transforms');
    expect(categories).toContain('cryptography');
    expect(categories).toContain('optimization');
  });

  test('search filtering by name', () => {
    const query = 'grover';
    const results = algorithms.filter((a) =>
      a.name.toLowerCase().includes(query.toLowerCase()),
    );
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('grover');
  });

  test('search filtering by tag', () => {
    const tag = 'entanglement';
    const results = algorithms.filter((a) => a.tags.includes(tag));
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  test('search filtering by category', () => {
    const results = algorithms.filter((a) => a.category === 'search');
    expect(results.length).toBe(4); // deutsch-jozsa, bernstein-vazirani, simon, grover
  });

  test('all algorithm code files exist', () => {
    const CODE_FILES: Record<string, string> = {
      'bell-state': 'algorithms/bell-state/bell_state.py',
      teleportation: 'algorithms/teleportation/teleportation.py',
      ghz: 'algorithms/ghz/ghz_state.py',
      'superdense-coding': 'algorithms/superdense-coding/superdense_coding.py',
      'deutsch-jozsa': 'algorithms/deutsch-jozsa/deutsch_jozsa.py',
      'bernstein-vazirani': 'algorithms/bernstein-vazirani/bernstein_vazirani.py',
      simon: 'algorithms/simon/simon.py',
      grover: 'algorithms/grover/grover.py',
      qft: 'algorithms/qft/qft.py',
      shor: 'algorithms/shor/shor.py',
      vqe: 'algorithms/vqe/vqe.py',
      qaoa: 'algorithms/qaoa/qaoa.py',
    };

    const root = path.resolve(__dirname, '../..');
    for (const alg of algorithms) {
      const relPath = CODE_FILES[alg.id];
      expect(relPath).toBeTruthy();
      const fullPath = path.join(root, relPath!);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });
});
