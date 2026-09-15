#!/bin/bash
sed -i '/import {/,/} from "..\/data\/defaultMasterData";/d' src/services/adminConsole.service.ts

cat << 'INNER_EOF' > replacement.ts
  public async loadDemoMasterData(): Promise<void> {
    const { DEFAULT_PROJECTS, DEFAULT_CARRIERS, DEFAULT_MATERIALS, DEFAULT_TRUCKS, DEFAULT_DRIVERS } = await import('../data/defaultMasterData');
    this.projects = [...DEFAULT_PROJECTS];
    this.carriers = [...DEFAULT_CARRIERS];
    this.materials = [...DEFAULT_MATERIALS];
    this.trucks = [...DEFAULT_TRUCKS];
    this.drivers = [...DEFAULT_DRIVERS];
    await this.initializePricingRules();
    this.initializeUsers();
    this.initializeExceptions();
  }
INNER_EOF

# Replace loadDemoMasterData logic
node -e "
const fs = require('fs');
let content = fs.readFileSync('src/services/adminConsole.service.ts', 'utf8');
const replacement = fs.readFileSync('replacement.ts', 'utf8');
const startIndex = content.indexOf('  public loadDemoMasterData(): void {');
const endIndex = content.indexOf('  public getProjects(): ProjectEntity[] {');
if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + replacement + '\n' + content.substring(endIndex);
  fs.writeFileSync('src/services/adminConsole.service.ts', content);
} else {
  console.log('Could not find bounds for loadDemoMasterData replacement');
}
"
