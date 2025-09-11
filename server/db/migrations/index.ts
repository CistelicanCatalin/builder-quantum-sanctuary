import fs from 'fs/promises';
import path from 'path';
import { getMysqlPool } from '../mysql';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readMigrationFile(filename: string): Promise<string> {
    const filePath = path.join(__dirname, filename);
    return await fs.readFile(filePath, 'utf-8');
}

async function executeMigration(sql: string): Promise<void> {
    const pool = getMysqlPool();
    if (!pool) throw new Error('Database connection not available');

    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const statement of statements) {
        await pool.query(statement);
    }
}

async function getExecutedMigrations(): Promise<Set<string>> {
    const pool = getMysqlPool();
    if (!pool) throw new Error('Database connection not available');

    try {
        const [rows] = await pool.query('SELECT name FROM wp_manager_migrations');
        return new Set((rows as any[]).map(row => row.name));
    } catch (error) {
        // If table doesn't exist, return empty set
        return new Set();
    }
}

async function markMigrationAsExecuted(name: string): Promise<void> {
    const pool = getMysqlPool();
    if (!pool) throw new Error('Database connection not available');

    await pool.query(
        'INSERT INTO wp_manager_migrations (name) VALUES (?)',
        [name]
    );
}

export async function runMigrations(): Promise<void> {
    console.log('Starting database migrations...');

    const pool = getMysqlPool();
    if (!pool) {
        console.error('Failed to get database connection. Please check your MySQL configuration.');
        return;
    }

    try {
        // Get all migration files
        const files = await fs.readdir(__dirname);
        const migrationFiles = files
            .filter(f => f.endsWith('.sql'))
            .sort(); // Ensure order by filename

        // Get already executed migrations
        const executedMigrations = await getExecutedMigrations();

        // Execute each migration that hasn't been run yet
        for (const file of migrationFiles) {
            if (!executedMigrations.has(file)) {
                console.log(`Executing migration: ${file}`);
                const sql = await readMigrationFile(file);
                await executeMigration(sql);
                await markMigrationAsExecuted(file);
                console.log(`Completed migration: ${file}`);
            } else {
                console.log(`Skipping already executed migration: ${file}`);
            }
        }

        console.log('All migrations completed successfully');
    } catch (error) {
        console.error('Error running migrations:', error);
        throw error;
    }
}