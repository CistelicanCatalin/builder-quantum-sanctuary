import { RequestHandler } from "express";
import { z } from "zod";

const checkPermissionsSchema = z.object({
  siteId: z.string(),
});

export const checkFilePermissions: RequestHandler = async (req, res) => {
  try {
    const { siteId } = checkPermissionsSchema.parse(req.body);

    // Obținem detaliile site-ului din baza de date
    const { getMysqlPool } = await import("../db/mysql");
    const pool = getMysqlPool();
    
    let siteUrl: string | null = null;
    let apiKey: string | null = null;
    
    if (pool) {
      const [rows]: any = await pool.query("SELECT url, api_key FROM wp_manager_sites WHERE id = ?", [siteId]);
      if (Array.isArray(rows) && rows.length) {
        siteUrl = rows[0].url;
        apiKey = rows[0].api_key;
      }
    }
    
    if (!siteUrl || !apiKey) {
      return res.status(404).json({ error: "Site not found" });
    }

    try {
      // Apelăm plugin-ul WordPress pentru a obține permisiunile reale
      const response = await fetch(`${siteUrl.replace(/\/$/, "")}/wp-json/wpm/v1/security/file-permissions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${apiKey}` 
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`WordPress API call failed: ${response.status}`);
      }

      const wpData = await response.json();
      return res.json(wpData);

    } catch (wpError) {
      console.error("WordPress API error:", wpError);
      
      // Fallback cu date demo dacă plugin-ul nu răspunde
      const now = new Date();
      const installDate = new Date('2025-08-01T10:00:00.000Z');
      
      const fallbackResults = {
        status: "success",
        message: `Demo data pentru ${siteUrl} - Plugin WordPress nu este instalat sau nu răspunde`,
        permissions: [
        // Fișiere din root
        {
          file: "index.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: "wp-config.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: ".htaccess",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: "wp-config-sample.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-login.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-settings.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-load.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-blog-header.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-cron.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-mail.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "xmlrpc.php",
          currentPermissions: "0644",
          recommended: "0000",
          status: "warning",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "readme.html",
          currentPermissions: "0644",
          recommended: "0000",
          status: "warning",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "license.txt",
          currentPermissions: "0644",
          recommended: "0000",
          status: "warning",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        
        // Directoare importante
        {
          file: "wp-content/",
          currentPermissions: "0755",
          recommended: "0755",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: "wp-content/themes/",
          currentPermissions: "0755",
          recommended: "0755",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: "wp-content/plugins/",
          currentPermissions: "0755",
          recommended: "0755",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: "wp-content/uploads/",
          currentPermissions: "0777",
          recommended: "0755",
          status: "warning",
          created: installDate.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: "wp-admin/",
          currentPermissions: "0755",
          recommended: "0755",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-includes/",
          currentPermissions: "0755",
          recommended: "0755",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        
        // Fișiere din wp-admin
        {
          file: "wp-admin/index.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-admin/admin.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-admin/admin-ajax.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-admin/install.php",
          currentPermissions: "0644",
          recommended: "0000",
          status: "error",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        
        // Fișiere din wp-includes
        {
          file: "wp-includes/functions.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-includes/wp-db.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "wp-includes/version.php",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        
        // Fișiere de configurare și sistem
        {
          file: "wp-content/debug.log",
          currentPermissions: "0644",
          recommended: "0600",
          status: "warning",
          created: now.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: "wp-content/cache/",
          currentPermissions: "0755",
          recommended: "0755",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: ".user.ini",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: installDate.toISOString()
        },
        {
          file: "robots.txt",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: installDate.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: "sitemap.xml",
          currentPermissions: "0644",
          recommended: "0644",
          status: "ok",
          created: now.toISOString(),
          lastModified: now.toISOString()
        },
        
        // Fișiere sensibile ce ar trebui protejate
        {
          file: "wp-content/wp-config.php",
          currentPermissions: "0644",
          recommended: "0000",
          status: "error",
          created: installDate.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: ".env",
          currentPermissions: "0644",
          recommended: "0600",
          status: "warning",
          created: installDate.toISOString(),
          lastModified: now.toISOString()
        },
        {
          file: "wp-content/backup-db/",
          currentPermissions: "0777",
          recommended: "0700",
          status: "error",
          created: now.toISOString(),
          lastModified: now.toISOString()
        }
      ]
      };

      return res.json(fallbackResults);
    }

  } catch (error) {
    console.error("Error checking file permissions:", error);
    res.status(500).json({ error: "Failed to check file permissions" });
  }
};