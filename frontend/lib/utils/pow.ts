import CryptoJS from 'crypto-js';

export interface POWChallenge {
  challenge: string;
  expires_at: number;
}

export interface POWResponse {
  error_msg: string;
  data: POWChallenge;
}

export class POWSolver {
  private static readonly DIFFICULTY = 18;
  private static readonly TARGET_PREFIX = '0'.repeat(POWSolver.DIFFICULTY);

  static async solvePOW(challenge: string): Promise<number> {
    return new Promise((resolve) => {
      // 创建 Web Worker 代码
      const workerCode = `
        // 简单的 SHA256 实现，避免外部依赖
        function sha256(input) {
          const encoder = new TextEncoder();
          const data = encoder.encode(input);
          
          return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
          });
        }

        self.onmessage = async function(e) {
          const { challenge, targetPrefix } = e.data;
          let nonce = 0;
          
          while (true) {
            const input = challenge + ':' + nonce;
            const hash = await sha256(input);
            
            if (hash.startsWith(targetPrefix)) {
              self.postMessage({ success: true, nonce });
              break;
            }
            
            nonce++;
            
            // 每1000次计算报告一次进度
            if (nonce % 1000 === 0) {
              self.postMessage({ progress: nonce });
            }
          }
        };
      `;

      try {
        const worker = new Worker(
            URL.createObjectURL(new Blob([workerCode], {type: 'application/javascript'})),
        );

        worker.onmessage = (e) => {
          const {success, nonce, progress} = e.data;
          if (success) {
            worker.terminate();
            resolve(nonce);
          } else if (progress) {
            console.debug('PoW progress:', progress);
          }
        };

        worker.onerror = (error) => {
          console.error('Worker error:', error);
          worker.terminate();
          // 如果 Worker 出错，回退到同步计算
          POWSolver.solvePOWFallback(challenge).then(resolve);
        };

        worker.postMessage({
          challenge,
          targetPrefix: POWSolver.TARGET_PREFIX,
        });
      } catch (error) {
        console.error('Failed to create worker:', error);
        // 回退到同步计算
        POWSolver.solvePOWFallback(challenge).then(resolve);
      }
    });
  }

  static async solvePOWFallback(challenge: string): Promise<number> {
    let nonce = 0;

    while (true) {
      const input = `${challenge}:${nonce}`;
      const hash = CryptoJS.SHA256(input).toString();

      if (hash.startsWith(POWSolver.TARGET_PREFIX)) {
        return nonce;
      }

      nonce++;

      // 每100次计算让出控制权，避免阻塞UI
      if (nonce % 100 === 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
      }
    }
  }
}

export class POWManager {
  private static instance: POWManager;
  private cachedChallenge: POWChallenge | null = null;
  private solvingPromise: Promise<{ challenge: string; nonce: number }> | null = null;

  static getInstance(): POWManager {
    if (!POWManager.instance) {
      POWManager.instance = new POWManager();
    }
    return POWManager.instance;
  }

  async getChallengeAndSolve(): Promise<{ challenge: string; nonce: number }> {
    // 如果已经在解决中，返回现有的 Promise
    if (this.solvingPromise) {
      return this.solvingPromise;
    }

    // 检查缓存的 challenge 是否仍然有效
    if (this.cachedChallenge && Date.now() < this.cachedChallenge.expires_at * 1000) {
      this.solvingPromise = this.solveChallenge(this.cachedChallenge.challenge);
      return this.solvingPromise;
    }

    // 获取新的 challenge 并解决
    this.solvingPromise = this.fetchAndSolveChallenge();
    return this.solvingPromise;
  }

  private async fetchAndSolveChallenge(): Promise<{ challenge: string; nonce: number }> {
    try {
      const response = await fetch('/api/v1/projects/pow/challenge', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch challenge');
      }

      const data: POWResponse = await response.json();
      
      if (data.error_msg || !data.data) {
        throw new Error(data.error_msg || 'Invalid challenge response');
      }

      this.cachedChallenge = {
        challenge: data.data.challenge,
        expires_at: data.data.expires_at
      };

      return this.solveChallenge(data.data.challenge);
    } catch (error) {
      this.solvingPromise = null;
      throw error;
    }
  }

  private async solveChallenge(challenge: string): Promise<{ challenge: string; nonce: number }> {
    try {
      let nonce: number;

      // 尝试使用 Web Worker，如果不可用则使用 fallback
      if (typeof Worker !== 'undefined') {
        nonce = await POWSolver.solvePOW(challenge);
      } else {
        nonce = await POWSolver.solvePOWFallback(challenge);
      }

      const result = {challenge, nonce};
      this.solvingPromise = null;
      return result;
    } catch (error) {
      this.solvingPromise = null;
      throw error;
    }
  }

  clearCache(): void {
    this.cachedChallenge = null;
    this.solvingPromise = null;
  }
}
