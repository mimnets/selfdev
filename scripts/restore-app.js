import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function restore() {
    const backupsDir = path.join(__dirname, '..', 'backups');

    if (!fs.existsSync(backupsDir)) {
        console.log('❌ No backups found!');
        process.exit(1);
    }

    // List available backups
    const backups = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith('backup-'))
        .sort()
        .reverse();

    if (backups.length === 0) {
        console.log('❌ No backups found!');
        process.exit(1);
    }

    console.log('\n📦 Available backups:\n');
    backups.forEach((backup, index) => {
        const infoPath = path.join(backupsDir, backup, 'BACKUP_INFO.json');
        if (fs.existsSync(infoPath)) {
            const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
            console.log(`${index + 1}. ${backup}`);
            console.log(`   Created: ${new Date(info.timestamp).toLocaleString()}`);
            console.log(`   Description: ${info.description}\n`);
        }
    });

    const choice = await question('Enter backup number to restore (or 0 to cancel): ');
    const backupIndex = parseInt(choice) - 1;

    if (backupIndex < 0 || backupIndex >= backups.length) {
        console.log('❌ Cancelled');
        rl.close();
        return;
    }

    const backupToRestore = backups[backupIndex];
    const backupPath = path.join(backupsDir, backupToRestore);

    const confirm = await question(`\n⚠️  This will overwrite your current code. Continue? (yes/no): `);

    if (confirm.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled');
        rl.close();
        return;
    }

    console.log('\n🔄 Restoring backup...');

    try {
        // Copy files back
        const items = fs.readdirSync(backupPath).filter(f => f !== 'BACKUP_INFO.json');

        items.forEach(item => {
            const srcPath = path.join(backupPath, item);
            const destPath = path.join(__dirname, '..', item);

            console.log(`  ✓ Restoring ${item}...`);

            // Remove existing
            if (fs.existsSync(destPath)) {
                fs.rmSync(destPath, { recursive: true, force: true });
            }

            // Copy from backup
            copyRecursive(srcPath, destPath);
        });

        console.log('\n✅ Restoration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: npm install');
        console.log('2. Run: npm run dev');

    } catch (error) {
        console.error('❌ Restoration failed:', error);
    }

    rl.close();
}

function copyRecursive(src, dest) {
    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        const files = fs.readdirSync(src);

        files.forEach(file => {
            copyRecursive(path.join(src, file), path.join(dest, file));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

restore();
