import { MongoClient, Db, Collection } from 'mongodb';
import { MONGODB_URI, MONGODB_DB_NAME } from '../constants';
import { logger } from '../logger/winston';

class MongoDBConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        return;
      }

      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db(MONGODB_DB_NAME);
      this.isConnected = true;
      
      logger.info('Successfully connected to MongoDB');
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        this.isConnected = false;
        logger.info('Disconnected from MongoDB');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollection<T = any>(name: string): Collection<T> {
    return this.getDb().collection<T>(name);
  }

  isDbConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const mongodb = new MongoDBConnection();

// Helper function to ensure connection
export async function ensureConnection(): Promise<void> {
  if (!mongodb.isDbConnected()) {
    await mongodb.connect();
  }
}