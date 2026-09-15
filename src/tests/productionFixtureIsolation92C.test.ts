import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('BLOCK 92C - Production Fixture Isolation', () => {
  it('should not contain static imports of DEFAULT_PROJECTS in production codebase', () => {
    const srcDir = path.join(process.cwd(), 'src');
    const leakFiles = findLeaks(srcDir, 'DEFAULT_PROJECTS');
    expect(leakFiles).toEqual([]);
  });

  it('should not contain static imports of MASTER_PRICING_RULES in production codebase', () => {
    const srcDir = path.join(process.cwd(), 'src');
    const leakFiles = findLeaks(srcDir, 'MASTER_PRICING_RULES');
    expect(leakFiles).toEqual([]);
  });
  
  it('should not contain static imports of SAMPLE_QUALITY_CONTEXT in production codebase', () => {
    const srcDir = path.join(process.cwd(), 'src');
    const leakFiles = findLeaks(srcDir, 'SAMPLE_QUALITY_CONTEXT');
    expect(leakFiles).toEqual([]);
  });

  function findLeaks(dir: string, keyword: string): string[] {
    let leaks: string[] = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (file === 'tests' || file === 'data') continue;
        leaks = leaks.concat(findLeaks(fullPath, keyword));
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // We only care about static imports.
        if (content.includes(`import { ${keyword}`) || content.includes(`import { ${keyword},`) || content.includes(`, ${keyword} }`)) {
          leaks.push(fullPath);
        } else if (content.includes(`import ${keyword} `)) {
          leaks.push(fullPath);
        } else if (content.includes(keyword) && !content.includes('import(') && !fullPath.includes('adminConsole.service.ts') && !fullPath.includes('reportsEngine.service.ts') && !fullPath.includes('dataCleanup.service.ts') && !fullPath.includes('mockTemplateData.ts')) {
          // If it uses it but doesn't dynamically import it, flag it. (ignoring services that document it or data files)
          leaks.push(fullPath);
        }
      }
    }
    return leaks;
  }
});
