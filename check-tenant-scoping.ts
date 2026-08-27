import { readFileSync } from 'fs';
import { join } from 'path';

const schemaPath = join(__dirname, '../prisma/schema.prisma');
const schemaContent = readFileSync(schemaPath, 'utf8');

// Extrait chaque bloc "model X { ... }" avec son tenantId (nullable ou non) et son @@map
const modelsInfo: { name: string; hasTenantId: boolean; nullable: boolean; table: string | null }[] = [];
const modelRegex = /model\s+([A-Za-z0-9_]+)\s+{([^}]+)}/g;
let match;
while ((match = modelRegex.exec(schemaContent)) !== null) {
  const name = match[1];
  const body = match[2];
  const tenantMatch = body.match(/tenantId\s+String(\?)?/);
  const mapMatch = body.match(/@@map\("([a-z0-9_]+)"\)/);
  modelsInfo.push({
    name,
    hasTenantId: !!tenantMatch,
    nullable: !!(tenantMatch && tenantMatch[1] === '?'),
    table: mapMatch ? mapMatch[1] : null,
  });
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

// Modèles exemptés de TENANT_SCOPED_MODELS car protégés uniquement par RLS
// (accès via contexte tenant géré manuellement, ex. super-admin, billing pré-auth)
const rlsOnlyExceptions = ['PaymentProof', 'AuditLog'];
// Modèles jamais tenant-scoped (système)
const notTenantScoped = ['Tenant', 'User'];

let hasError = false;
for (const m of modelsInfo) {
  if (!m.hasTenantId || notTenantScoped.includes(m.name)) continue;

  if (!m.nullable && !rlsOnlyExceptions.includes(m.name) && !scopedModels.includes(m.name)) {
    console.error(`FAILLE: "${m.name}" a tenantId obligatoire mais absent de TENANT_SCOPED_MODELS`);
    hasError = true;
  }

  if (!m.table) {
    console.error(`ATTENTION: "${m.name}" n'a pas de @@map — impossible de vérifier sa policy RLS`);
    continue;
  }
  if (!rlsTables.has(m.table)) {
    console.error(`FAILLE: "${m.name}" (table "${m.table}") a tenantId mais aucune policy RLS`);
    hasError = true;
  }
}

if (hasError) { console.error('Echec verification tenant scoping.'); process.exit(1); }
console.log('OK: tenant scoping complet (app-layer + RLS).');
process.exit(0);
