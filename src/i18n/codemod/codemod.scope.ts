import ts from 'typescript';
import { CodemodCandidate } from './codemod.types';

export interface ScopeCollision {
  position: number;
  line: number;
  column: number;
  bindingName: string;
  scopeKind: string;
  collidingNodeText: string;
}

export class CodemodScopeAnalyzer {
  private static instance: CodemodScopeAnalyzer;

  public static getInstance(): CodemodScopeAnalyzer {
    if (!CodemodScopeAnalyzer.instance) {
      CodemodScopeAnalyzer.instance = new CodemodScopeAnalyzer();
    }
    return CodemodScopeAnalyzer.instance;
  }

  /**
   * Deterministically resolves a collision-free translation binding name.
   * Priority:
   * 1. 't' (if safe and not shadowed across any target positions in component)
   * 2. 'translate' (standard safe fallback)
   * 3. 'translateText' (secondary safe fallback)
   * 4. 'i18nT' (tertiary safe fallback)
   */
  public resolveTranslationBindingName(
    sourceFile: ts.SourceFile,
    componentNode: ts.Node,
    candidatePositions: number[]
  ): string {
    const candidates = ['t', 'translate', 'translateText', 'i18nT'];

    for (const name of candidates) {
      const collisions = this.findBindingCollisions(sourceFile, candidatePositions, name, componentNode);
      if (collisions.length === 0) {
        return name;
      }
    }

    // Fallback if extreme collisions occur
    let suffix = 1;
    while (true) {
      const candidate = `translate_${suffix}`;
      const collisions = this.findBindingCollisions(sourceFile, candidatePositions, candidate, componentNode);
      if (collisions.length === 0) {
        return candidate;
      }
      suffix++;
    }
  }

  /**
   * Finds all binding collisions where a candidate position would have its desired
   * translation function shadowed by an intervening local variable, parameter, or pattern.
   */
  public findBindingCollisions(
    sourceFile: ts.SourceFile,
    positions: number[],
    desiredBinding: string = 't',
    scopeBoundaryNode?: ts.Node
  ): ScopeCollision[] {
    const collisions: ScopeCollision[] = [];

    for (const pos of positions) {
      const collision = this.checkPositionForCollision(sourceFile, pos, desiredBinding, scopeBoundaryNode);
      if (collision) {
        collisions.push(collision);
      }
    }

    return collisions;
  }

  /**
   * Checks if an identifier name is bound in the lexical scope of a specific position,
   * excluding the hook declaration itself (`const { t } = useI18n()`).
   */
  public isIdentifierBoundInScope(
    sourceFile: ts.SourceFile,
    position: number,
    identifierName: string,
    scopeBoundaryNode?: ts.Node
  ): boolean {
    const collision = this.checkPositionForCollision(sourceFile, position, identifierName, scopeBoundaryNode);
    return collision !== null;
  }

  private checkPositionForCollision(
    sourceFile: ts.SourceFile,
    position: number,
    desiredBinding: string,
    scopeBoundaryNode?: ts.Node
  ): ScopeCollision | null {
    const ancestors = this.getAncestorsAtPosition(sourceFile, position);

    for (const node of ancestors) {
      if (scopeBoundaryNode && node === scopeBoundaryNode) {
        // Stop checking beyond the component boundary if provided
        break;
      }

      // Check function/arrow/method parameters
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node)
      ) {
        for (const param of node.parameters) {
          if (this.bindingContainsIdentifier(param.name, desiredBinding)) {
            const lc = sourceFile.getLineAndCharacterOfPosition(param.getStart(sourceFile));
            return {
              position,
              line: lc.line + 1,
              column: lc.character + 1,
              bindingName: desiredBinding,
              scopeKind: ts.SyntaxKind[node.kind],
              collidingNodeText: param.getText(sourceFile),
            };
          }
        }
      }

      // Check catch clause parameters
      if (ts.isCatchClause(node) && node.variableDeclaration) {
        if (this.bindingContainsIdentifier(node.variableDeclaration.name, desiredBinding)) {
          const lc = sourceFile.getLineAndCharacterOfPosition(node.variableDeclaration.getStart(sourceFile));
          return {
            position,
            line: lc.line + 1,
            column: lc.character + 1,
            bindingName: desiredBinding,
            scopeKind: 'CatchClause',
            collidingNodeText: node.variableDeclaration.getText(sourceFile),
          };
        }
      }

      // Check variable statements inside blocks/scopes
      if (ts.isBlock(node)) {
        for (const stmt of node.statements) {
          if (ts.isVariableStatement(stmt)) {
            // Ignore the useI18n() hook invocation declaration
            if (this.isI18nHookVariableStatement(stmt, sourceFile)) {
              continue;
            }

            for (const decl of stmt.declarationList.declarations) {
              if (this.bindingContainsIdentifier(decl.name, desiredBinding)) {
                // If the declaration occurs before the target position or within the same block scope
                const lc = sourceFile.getLineAndCharacterOfPosition(decl.getStart(sourceFile));
                return {
                  position,
                  line: lc.line + 1,
                  column: lc.character + 1,
                  bindingName: desiredBinding,
                  scopeKind: 'VariableDeclaration',
                  collidingNodeText: decl.getText(sourceFile),
                };
              }
            }
          }
        }
      }

      // Check for-in / for-of / for initializer
      if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) {
        if (node.initializer && ts.isVariableDeclarationList(node.initializer)) {
          for (const decl of node.initializer.declarations) {
            if (this.bindingContainsIdentifier(decl.name, desiredBinding)) {
              const lc = sourceFile.getLineAndCharacterOfPosition(decl.getStart(sourceFile));
              return {
                position,
                line: lc.line + 1,
                column: lc.character + 1,
                bindingName: desiredBinding,
                scopeKind: ts.SyntaxKind[node.kind],
                collidingNodeText: decl.getText(sourceFile),
              };
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Helper to check if a binding name (Identifier, ObjectBindingPattern, ArrayBindingPattern)
   * binds a specific identifier name.
   */
  public bindingContainsIdentifier(nameNode: ts.BindingName, targetName: string): boolean {
    if (ts.isIdentifier(nameNode)) {
      return nameNode.text === targetName;
    }

    if (ts.isObjectBindingPattern(nameNode) || ts.isArrayBindingPattern(nameNode)) {
      for (const element of nameNode.elements) {
        if (ts.isBindingElement(element)) {
          if (this.bindingContainsIdentifier(element.name, targetName)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Detects whether a VariableStatement represents an i18n hook declaration like:
   * const { t } = useI18n(); or const { t: translate } = useI18n();
   */
  private isI18nHookVariableStatement(stmt: ts.VariableStatement, sourceFile: ts.SourceFile): boolean {
    for (const decl of stmt.declarationList.declarations) {
      if (decl.initializer && ts.isCallExpression(decl.initializer)) {
        const exprText = decl.initializer.expression.getText(sourceFile);
        if (exprText === 'useI18n' || exprText.endsWith('.useI18n')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Traverses up from the innermost node containing targetPos to the root SourceFile.
   */
  public getAncestorsAtPosition(sourceFile: ts.SourceFile, position: number): ts.Node[] {
    const ancestors: ts.Node[] = [];

    const visit = (node: ts.Node) => {
      const start = node.getStart(sourceFile);
      const end = node.getEnd();

      if (position >= start && position <= end) {
        ancestors.push(node);
        ts.forEachChild(node, visit);
      }
    };

    visit(sourceFile);
    return ancestors.reverse(); // innermost to outermost
  }
}
