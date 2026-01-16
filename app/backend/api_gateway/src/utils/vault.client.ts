import axios, { AxiosInstance } from 'axios';

interface VaultSecrets {
  JWT_SECRET: string;
  JWT_REFRESH: string;
  COOKIE_SECRET: string;
  INTERNAL_SECRET_KEY: string;
}

class VaultClient {
  private client: AxiosInstance;
  private secrets: VaultSecrets | null = null;

  constructor() {
    const vaultAddr = process.env.VAULT_ADDR || 'http://vault:8200';
    const vaultToken = process.env.VAULT_TOKEN || 'dev-root-token';

    this.client = axios.create({
      baseURL: vaultAddr,
      headers: {
        'X-Vault-Token': vaultToken,
      },
      timeout: 5000,
    });
  }

  async getSecrets(path: string = 'secret/data/app'): Promise<VaultSecrets> {
    try {
      const response = await this.client.get(`/v1/${path}`);
      return response.data.data.data as VaultSecrets;
    } catch (error: any) {
      throw new Error('Could not fetch secrets from Vault');
    }
  }

  async loadSecrets(): Promise<VaultSecrets> {
    if (!this.secrets)
      this.secrets = await this.getSecrets();
    return this.secrets;
  }

  getSecret(key: keyof VaultSecrets): string {
    if (!this.secrets) {
      throw new Error('Secrets not loaded. Call loadSecrets() first.');
    }
    return this.secrets[key];
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/v1/sys/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const vaultClient = new VaultClient();
