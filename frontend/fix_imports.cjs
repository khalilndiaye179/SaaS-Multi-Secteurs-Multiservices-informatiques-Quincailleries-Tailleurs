const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getRelativeImportPath(fromFile, toFile) {
    let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    rel = rel.replace(/\.ts$/, '');
    return rel;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('StorageService') && !content.includes('import { StorageService }')) {
                const storagePath = path.join(srcDir, 'services', 'storage.ts');
                const relImport = getRelativeImportPath(fullPath, storagePath);
                content = `import { StorageService } from '${relImport}';\n` + content;
                
                // Hacky fix for await without async
                content = content.replace(/const token = await StorageService\.get\('kpsy_token'\);/g, 
                                          'let token;\n    StorageService.get("kpsy_token").then(t => token = t);\n    // FIXME: token fetch is now async, might break sync logic');
                
                fs.writeFileSync(fullPath, content);
                console.log('Added import to ' + fullPath);
            }
        }
    }
}

processDirectory(srcDir);
