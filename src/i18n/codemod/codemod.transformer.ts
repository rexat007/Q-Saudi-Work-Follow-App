/**
 * BLOCK 44 — Safe Automated i18n Codemod Engine
 * AST-Based In-Memory Transformer
 */

import ts from 'typescript';
import { CodemodCandidate, TransformResult } from './codemod.types';
import { CodemodImportManager } from './codemod.importManager';
import { CodemodScopeAnalyzer } from './codemod.scope';

export class CodemodTransformer {
  private importManager: CodemodImportManager;
  private scopeAnalyzer: CodemodScopeAnalyzer;

  constructor(importManager?: CodemodImportManager, scopeAnalyzer?: CodemodScopeAnalyzer) {
    this.importManager = importManager || new CodemodImportManager();
    this.scopeAnalyzer = scopeAnalyzer || CodemodScopeAnalyzer.getInstance();
  }

  /**
   * Transforms source code in-memory by applying eligible candidates.
   * NEVER writes to disk.
   */
  public transformInMemory(
    sourceCode: string,
    filePath: string,
    candidates: CodemodCandidate[]
  ): TransformResult {
    const isTsx = filePath.endsWith('.tsx');
    const appliedCandidates: CodemodCandidate[] = [];
    const skippedCandidates: CodemodCandidate[] = [];

    // Filter to only actionable candidates (e.g. SAFE, LOW_RISK, HIGH_RISK)
    const eligibleCandidates = candidates.filter(
      (c) =>
        (c.classification === 'TRANSFORM_SAFE' ||
          c.classification === 'TRANSFORM_LOW_RISK' ||
          c.classification === 'TRANSFORM_HIGH_RISK') &&
        c.translationKey !== null
    );

    if (eligibleCandidates.length === 0) {
      return {
        transformedContent: sourceCode,
        isValid: true,
        parseErrors: [],
        appliedCandidates: [],
        skippedCandidates: candidates,
      };
    }

    // Parse initial source file to analyze lexical scopes and identifier shadowing
    const initialSf = ts.createSourceFile(
      isTsx ? 'temp.tsx' : 'temp.ts',
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const bindingOverrides = new Map<CodemodCandidate, string>();
    const requiredBindingsPerComp = new Map<string, Set<string>>();

    for (const cand of eligibleCandidates) {
      const collisions = this.scopeAnalyzer.findBindingCollisions(initialSf, [cand.sourceLocation.startPos], 't');
      if (collisions.length > 0) {
        const safeBinding = this.scopeAnalyzer.resolveTranslationBindingName(initialSf, initialSf, [cand.sourceLocation.startPos]);
        bindingOverrides.set(cand, safeBinding);
        const comp = cand.targetComponent || 'default';
        const set = requiredBindingsPerComp.get(comp) || new Set(['t']);
        set.add(safeBinding);
        requiredBindingsPerComp.set(comp, set);
      }
    }

    // Sort candidates descending by startPos to replace from bottom to top without invalidating positions
    const sortedCandidates = [...eligibleCandidates].sort(
      (a, b) => b.sourceLocation.startPos - a.sourceLocation.startPos
    );

    let transformedCode = sourceCode;

    for (const cand of sortedCandidates) {
      const { startPos, endPos } = cand.sourceLocation;

      // Extract existing snippet
      const currentSnippet = transformedCode.substring(startPos, endPos);

      // Perform surgical replacement with collision-safe binding
      const before = transformedCode.substring(0, startPos);
      const after = transformedCode.substring(endPos);

      let replacement = cand.proposedReplacement;
      const safeBinding = bindingOverrides.get(cand);
      if (safeBinding && safeBinding !== 't') {
        replacement = replacement.replace(/\bt\(/g, `${safeBinding}(`);
      }

      transformedCode = before + replacement + after;
      appliedCandidates.push(cand);
    }

    // Mark non-eligible as skipped
    for (const cand of candidates) {
      if (!appliedCandidates.includes(cand)) {
        skippedCandidates.push(cand);
      }
    }

    // Determine if we need to insert `const { t } = useI18n();` and `import { useI18n } from '...'`
    const needsHook = appliedCandidates.some((c) => c.requiresHook);
    const needsImport = appliedCandidates.some((c) => c.requiresImport);

    if (needsHook || needsImport) {
      transformedCode = this.injectHookAndImport(transformedCode, filePath, appliedCandidates, requiredBindingsPerComp);
    }

    // Validate in-memory transformed syntax with TypeScript Compiler
    const sf = ts.createSourceFile(
      isTsx ? 'in_memory.tsx' : 'in_memory.ts',
      transformedCode,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const parseDiagnostics = (sf as any).parseDiagnostics || [];
    const parseErrors = parseDiagnostics.map((d: any) =>
      typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText
    );

    return {
      transformedContent: transformedCode,
      isValid: parseErrors.length === 0,
      parseErrors,
      appliedCandidates,
      skippedCandidates,
    };
  }

  /**
   * Safely injects the import statement and hook call into in-memory source.
   */
  private injectHookAndImport(
    sourceCode: string,
    filePath: string,
    appliedCandidates: CodemodCandidate[],
    requiredBindingsPerComp: Map<string, Set<string>> = new Map()
  ): string {
    const isTsx = filePath.endsWith('.tsx');
    let code = sourceCode;

    // 1. Inject useI18n import if needed
    const needsImport = appliedCandidates.some((c) => c.requiresImport);
    if (needsImport && !code.includes('useI18n')) {
      const relPath = this.importManager.calculateRelativeI18nPath(filePath);
      const importLine = `import { useI18n } from '${relPath}';\n`;

      // Find last import statement to insert cleanly after
      const sf = ts.createSourceFile(
        isTsx ? 'temp.tsx' : 'temp.ts',
        code,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      let lastImportEnd = 0;
      for (const st of sf.statements) {
        if (ts.isImportDeclaration(st)) {
          lastImportEnd = st.getEnd();
        }
      }

      if (lastImportEnd > 0) {
        code = code.substring(0, lastImportEnd) + '\n' + importLine + code.substring(lastImportEnd);
      } else {
        code = importLine + code;
      }
    }

    // 2. Inject `const { t } = useI18n();` inside target component function if needed
    const targetComponents = Array.from(
      new Set(appliedCandidates.filter((c) => c.requiresHook && c.targetComponent).map((c) => c.targetComponent!))
    );

    for (const compName of targetComponents) {
      const requiredBindings = requiredBindingsPerComp.get(compName) || new Set(['t']);
      const hookBindingsStr = requiredBindings.has('translate')
        ? (requiredBindings.has('t') ? 't, t: translate' : 't: translate')
        : 't';

      // Check if useI18n() is already called in the file
      const existingHookPattern = /const\s*\{([^}]+)\}\s*=\s*useI18n\(\);/;
      const hookMatch = existingHookPattern.exec(code);

      if (hookMatch) {
        const vars = hookMatch[1].split(',').map((s) => s.trim());
        let needsUpdate = false;
        let newVars = [...vars];

        if (requiredBindings.has('translate') && !vars.some(v => v.includes('translate'))) {
          newVars.push('t: translate');
          needsUpdate = true;
        }
        if (requiredBindings.has('t') && !vars.some(v => v === 't')) {
          newVars.push('t');
          needsUpdate = true;
        }

        if (needsUpdate) {
          const replacedHook = `const { ${newVars.join(', ')} } = useI18n();`;
          code = code.replace(hookMatch[0], replacedHook);
        }
      } else {
        // Find component declaration using TypeScript AST
        let insertIdx: number | null = null;
        try {
          const sf = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
          const findComp = (node: ts.Node) => {
            if (insertIdx !== null) return;
            if (ts.isFunctionDeclaration(node) && node.name && node.name.text === compName && node.body) {
              insertIdx = node.body.getStart(sf) + 1;
              return;
            }
            if (ts.isVariableStatement(node)) {
              for (const decl of node.declarationList.declarations) {
                if (ts.isIdentifier(decl.name) && decl.name.text === compName && decl.initializer) {
                  if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                    const body = decl.initializer.body;
                    if (ts.isBlock(body)) {
                      insertIdx = body.getStart(sf) + 1;
                      return;
                    }
                  }
                }
              }
            }
            ts.forEachChild(node, findComp);
          };
          findComp(sf);
        } catch {
          insertIdx = null;
        }

        const hookStatement = `\n  const { ${hookBindingsStr} } = useI18n();`;
        if (insertIdx !== null) {
          code = code.substring(0, insertIdx) + hookStatement + code.substring(insertIdx);
        } else {
          // Fallback regex pattern
          const compPattern = new RegExp(`(function\\s+${compName}[^{]*\\{|const\\s+${compName}[^{]*=>\\s*\\{)`);
          const match = compPattern.exec(code);
          if (match) {
            const idx = match.index + match[0].length;
            code = code.substring(0, idx) + hookStatement + code.substring(idx);
          }
        }
      }
    }

    return code;
  }
}
