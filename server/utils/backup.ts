import { getMysqlPool } from "../db/mysql";
import archiver from "archiver";
import { createWriteStream } from "fs";
import { mkdir, unlink, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const BACKUPS_DIR = path.join(process.cwd(), "storage", "backups");

// Asigură-te că directorul pentru backup-uri există
async function ensureBackupsDir() {
    await mkdir(BACKUPS_DIR, { recursive: true });
}

// Funcție pentru a face backup la baza de date de la un site WordPress
async function backupDatabase(siteUrl: string, apiKey: string): Promise<string> {
    const response = await fetch(`${siteUrl}/wp-json/wpm/v1/backup/database`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to backup database: ${response.statusText}`);
    }
    
    const tempFile = path.join(BACKUPS_DIR, `temp_db_${Date.now()}.sql`);
    const fileStream = createWriteStream(tempFile);
    await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
    
    return tempFile;
}

// Funcție pentru a face backup la fișiere de la un site WordPress
async function backupFiles(siteUrl: string, apiKey: string): Promise<string> {
    const response = await fetch(`${siteUrl}/wp-json/wpm/v1/backup/files`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to backup files: ${response.statusText}`);
    }
    
    const tempFile = path.join(BACKUPS_DIR, `temp_files_${Date.now()}.zip`);
    const fileStream = createWriteStream(tempFile);
    await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
    
    return tempFile;
}

// Funcția principală pentru crearea arhivei de backup
export async function createBackupArchive(backupId: number): Promise<void> {
    const pool = getMysqlPool();
    if (!pool) throw new Error("Database not configured");
    
    try {
        await ensureBackupsDir();
        
        // Obține informațiile despre backup și site
        const [[backup]]: any = await pool.query(
            "SELECT b.*, s.url, s.api_key FROM wp_manager_backups b JOIN wp_manager_sites s ON b.site_id = s.id WHERE b.id = ?",
            [backupId]
        );
        
        if (!backup) {
            throw new Error("Backup not found");
        }
        
        // Actualizează statusul la "in_progress"
        await pool.query(
            "UPDATE wp_manager_backups SET status = 'in_progress' WHERE id = ?",
            [backupId]
        );
        
        const backupFileName = `backup_${backupId}_${Date.now()}.zip`;
        const backupPath = path.join(BACKUPS_DIR, backupFileName);
        const output = createWriteStream(backupPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        
        archive.pipe(output);
        
        try {
            // În funcție de tipul de backup, adăugăm fișierele necesare
            if (backup.type === "full" || backup.type === "database") {
                const dbFile = await backupDatabase(backup.url, backup.api_key);
                archive.file(dbFile, { name: "database.sql" });
                // Ștergem fișierul temporar după ce terminăm
                setTimeout(async () => {
                    try {
                        await unlink(dbFile);
                    } catch (error) {
                        console.error(`Failed to delete temporary file ${dbFile}:`, error);
                    }
                }, 1000);
            }
            
            if (backup.type === "full" || backup.type === "files") {
                const filesArchive = await backupFiles(backup.url, backup.api_key);
                archive.file(filesArchive, { name: "files.zip" });
                // Ștergem fișierul temporar după ce terminăm
                setTimeout(async () => {
                    try {
                        await unlink(filesArchive);
                    } catch (error) {
                        console.error(`Failed to delete temporary file ${filesArchive}:`, error);
                    }
                }, 1000);
            }
            
            await archive.finalize();
            
            // Calculăm mărimea fișierului
            const stats = await new Promise((resolve, reject) => {
                output.on("close", () => {
                    resolve(archive.pointer());
                });
            });
            
            // Actualizăm înregistrarea cu informațiile finale
            await pool.query(
                `UPDATE wp_manager_backups 
                 SET status = 'completed', 
                     completed_at = NOW(),
                     size_bytes = ?,
                     download_url = ?
                 WHERE id = ?`,
                [stats, `/api/backups/download/${backupFileName}`, backupId]
            );
        } catch (error) {
            // În caz de eroare, actualizăm statusul
            await pool.query(
                "UPDATE wp_manager_backups SET status = 'failed', error_message = ? WHERE id = ?",
                [error.message, backupId]
            );
            throw error;
        }
    } catch (error) {
        console.error(`Backup ${backupId} failed:`, error);
        throw error;
    }
}

// Funcție pentru ștergerea unui backup
export async function deleteBackupFile(backupId: number): Promise<void> {
    const pool = getMysqlPool();
    if (!pool) throw new Error("Database not configured");
    
    try {
        // Găsește toate informațiile despre backup
        const [[backup]]: any = await pool.query(
            "SELECT id, download_url FROM wp_manager_backups WHERE id = ?",
            [backupId]
        );

        if (!backup) {
            console.log(`No backup found with ID ${backupId}`);
            return;
        }

        // Găsește fișierul de backup după pattern
        const filePattern = `backup_${backupId}_*.zip`;
        const filePath = path.join(BACKUPS_DIR, filePattern);
        console.log(`Looking for backup file: ${filePath}`);

        // Folosim readdir pentru a găsi fișierul
        const files = await readdir(BACKUPS_DIR);
        const backupFile = files.find(file => file.startsWith(`backup_${backupId}_`) && file.endsWith('.zip'));

        if (backupFile) {
            const fullPath = path.join(BACKUPS_DIR, backupFile);
            console.log(`Deleting backup file: ${fullPath}`);
            await unlink(fullPath);
        } else {
            console.log(`No backup file found matching pattern: ${filePattern}`);
        }
    } catch (error) {
        console.error(`Error deleting backup ${backupId}:`, error);
        throw error;
    }
}

// Funcție pentru curățarea backup-urilor expirate
export async function cleanupExpiredBackups(): Promise<void> {
    const pool = getMysqlPool();
    if (!pool) return;
    
    try {
        // Găsește backup-urile expirate
        const [expired]: any = await pool.query(
            `SELECT id, download_url 
             FROM wp_manager_backups 
             WHERE status = 'completed' 
             AND DATE_ADD(created_at, INTERVAL retention_days DAY) < NOW()`
        );
        
        // Șterge fiecare backup expirat
        for (const backup of expired) {
            await deleteBackupFile(backup.id);
            await pool.query("DELETE FROM wp_manager_backups WHERE id = ?", [backup.id]);
        }
    } catch (error) {
        console.error("Failed to cleanup expired backups:", error);
    }
}

// Funcție pentru executarea backup-urilor programate
export async function executeScheduledBackups(): Promise<void> {
    const pool = getMysqlPool();
    if (!pool) return;
    
    try {
        // Găsește programările care trebuie executate
        const [schedules]: any = await pool.query(
            `SELECT * FROM wp_manager_backup_schedules 
             WHERE is_active = TRUE 
             AND next_run <= NOW()`
        );
        
        for (const schedule of schedules) {
            try {
                // Creează un nou backup
                const [result]: any = await pool.query(
                    `INSERT INTO wp_manager_backups 
                     (site_id, type, status, retention_days, is_manual) 
                     VALUES (?, ?, 'pending', ?, FALSE)`,
                    [schedule.site_id, schedule.type, schedule.retention_days]
                );
                
                // Pornește procesul de backup
                createBackupArchive(result.insertId).catch(console.error);
                
                // Calculează și actualizează următoarea rulare
                const nextRun = calculateNextRun(
                    schedule.frequency,
                    schedule.time_of_day,
                    schedule.day_of_week,
                    schedule.day_of_month
                );
                
                await pool.query(
                    `UPDATE wp_manager_backup_schedules 
                     SET last_run = NOW(), next_run = ? 
                     WHERE id = ?`,
                    [nextRun, schedule.id]
                );
            } catch (error) {
                console.error(`Failed to execute backup schedule ${schedule.id}:`, error);
            }
        }
    } catch (error) {
        console.error("Failed to process backup schedules:", error);
    }
}

// Funcție pentru calcularea următoarei rulări
export function calculateNextRun(
    frequency: string,
    timeOfDay: string,
    dayOfWeek: number | null,
    dayOfMonth: number | null
): Date {
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const result = new Date(now);
    
    result.setHours(hours, minutes, 0, 0);
    
    if (result <= now) {
        result.setDate(result.getDate() + 1);
    }
    
    switch (frequency) {
        case 'weekly':
            if (dayOfWeek !== null) {
                while (result.getDay() !== dayOfWeek) {
                    result.setDate(result.getDate() + 1);
                }
            }
            break;
            
        case 'monthly':
            if (dayOfMonth !== null) {
                result.setDate(dayOfMonth);
                if (result <= now) {
                    result.setMonth(result.getMonth() + 1);
                }
            }
            break;
    }
    
    return result;
}
