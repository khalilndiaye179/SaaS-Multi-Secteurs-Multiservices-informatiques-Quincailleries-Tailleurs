const fs = require('fs');
const path = require('path');

const directories = [
  "./frontend/src/components",
  "./frontend/src/pages",
  "./frontend/src/layouts"
];

const replacements = [
  // Backgrounds
  { regex: /bg-\[#090D16\]/g, replacement: "bg-[var(--bg-main)]" },
  { regex: /bg-\[#0F172A\]/g, replacement: "bg-[var(--bg-card)]" },
  { regex: /bg-\[#1E293B\]/g, replacement: "bg-[var(--bg-sidebar)]" },
  { regex: /bg-white/g, replacement: "bg-[var(--bg-card)]" },
  { regex: /bg-slate-900/g, replacement: "bg-[var(--bg-main)]" },
  { regex: /bg-slate-800/g, replacement: "bg-[var(--bg-card)]" },
  { regex: /bg-slate-50/g, replacement: "bg-[var(--bg-main)]" },

  // Texts
  { regex: /text-\[#F8FAFC\]/g, replacement: "text-[var(--text-main)]" },
  { regex: /text-white/g, replacement: "text-[var(--text-main)]" },
  { regex: /text-slate-800/g, replacement: "text-[var(--text-main)]" },
  { regex: /text-slate-900/g, replacement: "text-[var(--text-main)]" },
  { regex: /text-slate-400/g, replacement: "text-[var(--text-muted)]" },
  { regex: /text-slate-500/g, replacement: "text-[var(--text-muted)]" },
  { regex: /text-gray-900/g, replacement: "text-[var(--text-main)]" },
  { regex: /text-gray-500/g, replacement: "text-[var(--text-muted)]" },
  
  // Borders
  { regex: /border-slate-800/g, replacement: "border-[var(--border-color)]" },
  { regex: /border-slate-700/g, replacement: "border-[var(--border-color)]" },
  { regex: /border-slate-200/g, replacement: "border-[var(--border-color)]" },
  { regex: /border-gray-200/g, replacement: "border-[var(--border-color)]" }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  for (const { regex, replacement } of replacements) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      processFile(fullPath);
    }
  }
}

console.log("Starting Tailwind refactoring...");
directories.forEach(processDirectory);
console.log("Done.");
