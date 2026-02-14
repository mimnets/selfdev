import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(__dirname, '..', 'backups', `backup-${timestamp}`);

console.log('🔄 Creating backup...');

// Create backup directory
fs.mkdirSync(backupDir, { recursive: true });

// Files and directories to backup
const itemsToBackup = [
    'src',
    'public',
    'index.html',
    'package.json',
    'package-lock.json',
    'vite.config.js',
    'eslint.config.js',
    '.gitignore'
];

// Copy function
function copyRecursive(src, dest) {
    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        const files = fs.readdirSync(src);

        files.forEach(file => {
            // Skip node_modules and .git
            if (file === 'node_modules' || file === '.git' || file === 'dist') {
                return;
            }
            copyRecursive(path.join(src, file), path.join(dest, file));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Perform backup
try {
    itemsToBackup.forEach(item => {
        const srcPath = path.join(__dirname, '..', item);
        const destPath = path.join(backupDir, item);

        if (fs.existsSync(srcPath)) {
            console.log(`  ✓ Backing up ${item}...`);
            copyRecursive(srcPath, destPath);
        }
    });

    // Create backup info file
    const backupInfo = {
        timestamp: new Date().toISOString(),
        version: 'pre-supabase',
        description: 'Backup before Supabase integration with Google Auth',
        items: itemsToBackup
    };

    fs.writeFileSync(
        path.join(backupDir, 'BACKUP_INFO.json'),
        JSON.stringify(backupInfo, null, 2)
    );

    console.log('\n✅ Backup completed successfully!');
    console.log(`📁 Location: ${backupDir}`);
    console.log('\nTo restore, run: npm run restore');

} catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
}
