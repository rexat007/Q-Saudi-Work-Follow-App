const fs = require('fs');

let content = fs.readFileSync('src/services/adminConsole.service.ts', 'utf8');

// Remove static imports of DEFAULT_*
content = content.replace(/import\s*\{\s*DEFAULT_PROJECTS\s*,\s*DEFAULT_CARRIERS\s*,\s*DEFAULT_MATERIALS\s*,\s*DEFAULT_TRUCKS\s*,\s*DEFAULT_DRIVERS\s*\}\s*from\s*'\.\.\/data\/defaultMasterData';/g, '');

// Replace loadDemoMasterData logic
const replacement = `  public async loadDemoMasterData(): Promise<void> {
    const { DEFAULT_PROJECTS, DEFAULT_CARRIERS, DEFAULT_MATERIALS, DEFAULT_TRUCKS, DEFAULT_DRIVERS } = await import('../data/defaultMasterData');
    this.projects = [...DEFAULT_PROJECTS];
    this.carriers = [...DEFAULT_CARRIERS];
    this.materials = [...DEFAULT_MATERIALS];
    this.trucks = [...DEFAULT_TRUCKS];
    this.drivers = [...DEFAULT_DRIVERS];
    await this.initializePricingRules();
    this.initializeUsers();
    this.initializeExceptions();
  }`;

const regex = /public\s+loadDemoMasterData\(\)\s*:\s*void\s*\{[\s\S]*?(?=public\s+getProjects\(\)\s*:)/;
content = content.replace(regex, replacement + "\n\n  ");

// Write back
fs.writeFileSync('src/services/adminConsole.service.ts', content);
console.log('Fixed adminConsole.service.ts');
