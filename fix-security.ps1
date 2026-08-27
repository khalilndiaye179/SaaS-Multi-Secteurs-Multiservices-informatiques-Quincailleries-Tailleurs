$ErrorActionPreference = "Stop"

Write-Host "1. Ecriture du script de verification..." -ForegroundColor Cyan

$scriptContent = @'
import { readFileSync } from 'fs';
import { join } from 'path';

const schemaPath = join(__dirname, '../prisma/schema.prisma');
const schemaContent = readFileSync(schemaPath, 'utf8');

const modelsWithTenantId: string[] = [];
const modelRegex = /model\s+([A-Za-z0-9_]+)\s+{([^}]+)}/g;
let match;
while ((match = modelRegex.exec(schemaContent)) !== null) {
  if (match[2].includes('tenantId')) modelsWithTenantId.push(match[1]);
}

const prismaServicePath = join(__dirname, '../src/prisma/prisma.service.ts');
const prismaServiceContent = readFileSync(prismaServicePath, 'utf8');
const scopedMatch = prismaServiceContent.match(/const\s+TENANT_SCOPED_MODELS\s*=\s*\[(.*?)\]/);
if (!scopedMatch) { console.error("TENANT_SCOPED_MODELS introuvable"); process.exit(1); }
const scopedModels = scopedMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));

const rlsPath = join(__dirname, '../prisma/rls-policies.sql');
const rlsContent = readFileSync(rlsPath, 'utf8');
const rlsTables = new Set<string>();
const rlsRegex = /ALTER TABLE\s+"([a-z0-9_]+)"\s+ENABLE ROW LEVEL SECURITY/g;
while ((match = rlsRegex.exec(rlsContent)) !== null) rlsTables.add(match[1]);

const modelToTable = (m: string) => m.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase() + 's';

const exceptions = ['Tenant', 'User'];
const nullableTenantModels = ['Notification', 'SaaSQuote', 'PlatformAnalytics'];

let hasError = false;
for (const model of modelsWithTenantId) {
  if (exceptions.includes(model)) continue;
  if (!nullableTenantModels.includes(model) && !scopedModels.includes(model)) {
    console.error(`FAILLE: "${model}" a tenantId mais absent de TENANT_SCOPED_MODELS`);
    hasError = true;
  }
  const table = modelToTable(model);
  if (!rlsTables.has(table)) {
    console.error(`FAILLE: "${model}" (table "${table}") a tenantId mais aucune policy RLS`);
    hasError = true;
  }
}

if (hasError) { console.error('Echec verification tenant scoping.'); process.exit(1); }
console.log('OK: tenant scoping complet (app-layer + RLS).');
process.exit(0);
'@

Set-Content -Path "backend\scripts\check-tenant-scoping.ts" -Value $scriptContent -Encoding utf8

Write-Host "2. Verification tenant scoping..." -ForegroundColor Cyan
Set-Location backend
npx ts-node scripts/check-tenant-scoping.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "ECHEC verification. Arret du script. Corrigez avant de continuer." -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "3. Lancement des tests de securite..." -ForegroundColor Cyan
npm run test:security
if ($LASTEXITCODE -ne 0) {
    Write-Host "ECHEC des tests. Arret du script. Corrigez avant de continuer." -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host "4. Commit et push..." -ForegroundColor Cyan
git add MULTI-TENANT-SECURITY-COMPLIANCE.md PRODUCTION-SECURITY-GATE-REPORT.md backend/prisma/rls-policies.sql backend/src/modules/crm/client.service.ts backend/src/modules/crm/supplier.service.ts backend/src/modules/quincaillerie/depot.controller.ts backend/src/modules/quincaillerie/depot.service.ts backend/src/prisma/prisma.service.ts backend/test/tenant-isolation.e2e-spec.ts backend/scripts/check-tenant-scoping.ts

git commit -m "fix(security): RLS + tenant scoping sur 12 tables manquantes (Depot, Client, Supplier, etc.)"
git push

Write-Host "TERMINE. Renvoyez le zip GitHub pour verification." -ForegroundColor Green
