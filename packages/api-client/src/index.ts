import { Client, TablesDB, Storage, Account, ID, Query } from 'appwrite';

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  apiKey?: string; // server-side only
}

export function createClient(config: AppwriteConfig) {
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId);

  return client;
}

export function createServerClient(config: AppwriteConfig & { apiKey: string }) {
  // node-appwrite is used server-side
  const { Client: ServerClient, TablesDB: ServerTablesDB, Storage: ServerStorage } =
    require('node-appwrite');

  const client = new ServerClient()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  return {
    client,
    tablesDB: new ServerTablesDB(client),
    storage: new ServerStorage(client),
  };
}

export function createServices(client: Client) {
  return {
    tablesDB: new TablesDB(client),
    storage: new Storage(client),
    account: new Account(client),
  };
}

export { ID, Query };
export type { Client, TablesDB, Storage, Account };
