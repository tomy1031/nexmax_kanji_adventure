import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { unreadKanji } from './lib/ruby';

/**
 * すべての 漢字に ふりがな (2026-09-23).
 *
 * The scripts are checked line by line elsewhere (mukashi.test.ts). This
 * checks the *screens*: every piece of text in the source that can reach the
 * learner is read with the TypeScript parser, and two mistakes fail the build:
 *
 *   1. A kanji with no reading — in a string, a template, or JSX text.
 *   2. Furigana notation 「字(じ)」 written straight into JSX, outside
 *      <RubyText>. It renders with the brackets showing.
 *   3. A kanji from the data put on screen bare — `{k.char}`, `{w.word}`,
 *      `{title}` — outside <RubyText>. Use kanjiRuby(k) / w.name instead.
 *
 * What is not text the learner reads is skipped: comments, imports, object
 * keys, console output, className/style/key/src values, and aria-label
 * (read by a screen reader, which reads kanji fine).
 *
 * A few strings hold a bare kanji on purpose because the reading sits next
 * to it in the same record and the two are joined for display —
 * `{ ja: '剣', reading: 'けん' }`. Those properties are listed in PAIRED.
 */

const ROOTS = ['src/features', 'src/components', 'src/data', 'src/lib'];
const SKIP_FILE = /\.test\.|\.generated\.|kanji_master|src\/features\/dev\//;

/** Properties whose value is a bare kanji joined with a reading elsewhere. */
const PAIRED = new Set(['ja', 'char', 'word', 'plainName', 'exampleSentence', 'kanji']);

/** JSX attributes that never render as visible text. */
const SILENT_ATTR = new Set(['className', 'style', 'key', 'src', 'href', 'aria-label', 'alt', 'id', 'type']);

const HAS_KANJI = /[一-龯]/;
const HAS_RUBY_NOTATION = /[一-龯々0-9][（(][ぁ-んァ-ヶー]+[）)]/;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.tsx?$/.test(name) ? [p] : [];
  });

interface Finding {
  where: string;
  text: string;
  why: string;
}

const tagName = (el: ts.JsxElement): string => el.openingElement.tagName.getText();

const insideRubyText = (node: ts.Node): boolean => {
  for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
    // LogoTitle, LogoText and RibbonTitle pass their children straight to <RubyText>.
    // KanaText draws kana-only text with romaji (かな編); kana.test.ts keeps kanji out of it.
    if (ts.isJsxElement(p)) return ['RubyText', 'LogoTitle', 'LogoText', 'RibbonTitle', 'KanaText'].includes(tagName(p));
  }
  return false;
};

const skippedContext = (node: ts.Node): boolean => {
  for (let p: ts.Node | undefined = node.parent, child: ts.Node = node; p; child = p, p = p.parent) {
    if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) return true;
    if (ts.isPropertyAssignment(p) && p.name === child) return true;
    if (ts.isPropertyAssignment(p) && PAIRED.has(p.name.getText())) return true;
    if (ts.isJsxAttribute(p) && SILENT_ATTR.has(p.name.getText())) return true;
    if (ts.isCallExpression(p) && /^console\.|^new Error|\.test\(|\.match\(|\.replace\(|RegExp/.test(p.expression.getText())) return true;
    if (ts.isNewExpression(p) && /Error|RegExp/.test(p.expression.getText())) return true;
    if (ts.isElementAccessExpression(p)) return true;
    if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(p.operatorToken.kind)) return true;
    // Sets of characters used as lookup tables, e.g. new Set([...'一二三']).
    if (ts.isSpreadElement(p)) return true;
    // A character the code looks up, not text: const CHAR = '一'.
    if (ts.isVariableDeclaration(p) && /^[A-Z_]+$/.test(p.name.getText()) && /CHAR/.test(p.name.getText())) return true;
    // Glosses the element table matches against (English, plus the odd kanji).
    if (ts.isArrayLiteralExpression(p) && p.elements.length > 20) return true;
  }
  return false;
};

/** Whether an expression builds JSX itself (then its own text is checked where it is). */
const containsJsx = (node: ts.Node): boolean => {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return true;
  return ts.forEachChild(node, containsJsx) ?? false;
};

/** Whether an expression calls a local render helper, e.g. `ok && nodeButton(…)`. */
const callsRenderHelper = (node: ts.Node): boolean => {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && /Button|render/i.test(node.expression.text)) return true;
  return ts.forEachChild(node, callsRenderHelper) ?? false;
};

const scan = (file: string): Finding[] => {
  const src = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: Finding[] = [];
  const at = (n: ts.Node) => `${file}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;

  const check = (node: ts.Node, raw: string) => {
    // Hand-written HTML ruby (inside innerHTML) counts as read.
    const text = raw.replace(/<ruby>[^<]*<rt>[^<]*<\/rt><\/ruby>/g, '');
    if (!HAS_KANJI.test(text) || skippedContext(node)) return;
    const bare = unreadKanji(text);
    if (bare.length) out.push({ where: at(node), text: text.trim().slice(0, 60), why: `ふりがな なし: ${bare.join('')}` });
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const text = node.getText();
      if (HAS_KANJI.test(text) || HAS_RUBY_NOTATION.test(text)) {
        if (!insideRubyText(node)) {
          out.push({ where: at(node), text: text.trim().slice(0, 60), why: '<RubyText> の 外に 漢字' });
        } else {
          check(node, text);
        }
      }
    } else if (
      ts.isJsxExpression(node) &&
      node.expression &&
      ts.isJsxElement(node.parent) &&
      !insideRubyText(node) &&
      !containsJsx(node.expression) &&
      // A local render helper (nodeButton(…)) builds its own <RubyText>.
      !(ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression)) &&
      !callsRenderHelper(node.expression)
    ) {
      const expr = node.expression.getText();
      // Data that holds kanji, rendered straight into an element.
      if (/\.(char|word|plainName|title|summary|label|name|line|blurb|body)\b(?!\s*\()/.test(expr) && !/\.(length|map)\b/.test(expr)) {
        out.push({ where: at(node), text: expr.slice(0, 60), why: 'データの 漢字を <RubyText> の 外で 表示' });
      }
      // A template or string with furigana notation, outside <RubyText>.
      if (HAS_RUBY_NOTATION.test(expr)) {
        out.push({ where: at(node), text: expr.slice(0, 60), why: 'ふりがな記法が <RubyText> の 外' });
      }
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      check(node, node.text);
    } else if (ts.isTemplateExpression(node)) {
      const parts = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join('');
      check(node, parts);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
};

describe('すべての 漢字に ふりがな', () => {
  it('leaves no kanji on screen without a reading', () => {
    const files = ROOTS.flatMap(walk).filter((f) => !SKIP_FILE.test(f));
    const findings = files.flatMap(scan).map((f) => `${f.where}  ${f.why}  「${f.text}」`);
    expect(findings).toEqual([]);
  });
});
