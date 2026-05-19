#!/usr/bin/env node
/**
 * Safe orphan-class deletion using CSS AST (css-tree).
 *
 * Usage:
 *   node delete-orphans-ast.mjs <orphan-list.txt> < input.css > output.css
 *
 * Behavior:
 *   For each orphan class name in the list, we:
 *     1. Remove any Rule whose SelectorList consists ONLY of selectors
 *        that target the orphan (or its pseudo-class/attr variants).
 *     2. For multi-selector Rules where the orphan is ONE of several
 *        selectors, remove only the orphan selector from the list,
 *        preserving the rule for other selectors.
 *
 * Why AST over regex:
 *   Regex on minified single-line CSS cannot safely handle multi-selector
 *   rules — see feedback_perl_regex_unsafe_multi_selector.md. AST parsing
 *   gives us structural correctness.
 */
import { readFileSync } from 'node:fs';
import * as csstree from 'css-tree';

const [, , orphansFile] = process.argv;
if (!orphansFile) {
    console.error('Usage: node delete-orphans-ast.mjs <orphan-list.txt> < input.css > output.css');
    process.exit(2);
}

const orphans = new Set(
    readFileSync(orphansFile, 'utf8')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
);

const css = readFileSync('/dev/stdin', 'utf8');
const originalLen = css.length;

const ast = csstree.parse(css);

let rulesDeleted = 0;
let selectorsStripped = 0;

/**
 * Does this Selector contain ONLY a ClassSelector matching one of our orphans?
 * (Optionally followed by pseudo-classes, pseudo-elements, attribute selectors
 *  on the SAME element — i.e. compound but on a single element targeting the orphan.)
 *
 * Returns true if EVERY simple selector inside is either:
 *   - A ClassSelector matching an orphan
 *   - A PseudoClassSelector / PseudoElementSelector / AttributeSelector
 *     attached to the orphan
 *
 * This catches:
 *   .orphan, .orphan:hover, .orphan[disabled], .orphan::before
 *
 * Does NOT match:
 *   .other.orphan (orphan modifier on a non-orphan)
 *   .orphan .child (descendant — see selectorReferencesOrphan)
 *   .other .orphan (descendant — caller decides)
 */
function selectorIsSoleOrphan(selector) {
    let hasOrphanClass = false;
    let hasOtherClassOrType = false;

    csstree.walk(selector, {
        visit: 'ClassSelector',
        enter(node, item, list) {
            if (orphans.has(node.name)) {
                hasOrphanClass = true;
            } else {
                hasOtherClassOrType = true;
            }
        }
    });

    // Reject if any non-orphan class is present
    if (hasOtherClassOrType) return false;
    if (!hasOrphanClass) return false;

    // Reject if there are descendant combinators (space, >, +, ~)
    let hasCombinator = false;
    csstree.walk(selector, (node) => {
        if (node.type === 'Combinator') hasCombinator = true;
    });
    if (hasCombinator) return false;

    // Reject if there's a TypeSelector (e.g. .orphan span)
    let hasTypeSelector = false;
    csstree.walk(selector, (node) => {
        if (node.type === 'TypeSelector') hasTypeSelector = true;
    });
    if (hasTypeSelector) return false;

    return true;
}

/**
 * Does this Selector REFERENCE an orphan (anywhere in its chain)?
 * Used to decide: if a multi-selector rule has selectors mixing orphan
 * and non-orphan, we strip the orphan selector. If the selector chain
 * contains the orphan as a descendant of a non-orphan, we leave it
 * alone (conservative — orphan-as-descendant is unused-styling but
 * harmless).
 *
 * Returns true if the orphan appears as a class anywhere in the selector chain.
 */
function selectorReferencesOrphan(selector) {
    let refs = false;
    csstree.walk(selector, {
        visit: 'ClassSelector',
        enter(node) {
            if (orphans.has(node.name)) refs = true;
        }
    });
    return refs;
}

// Walk all Rules and decide
csstree.walk(ast, {
    visit: 'Rule',
    enter(node, item, list) {
        if (!node.prelude || node.prelude.type !== 'SelectorList') return;

        const selectors = node.prelude.children.toArray();

        // Categorize each selector
        const soleOrphan = [];      // selectors that ARE sole-orphan refs (safe to delete)
        const referencesOrphan = []; // selectors that contain orphan but are not sole (compound, descendant) — leave alone
        const keep = [];             // selectors with no orphan ref

        for (const sel of selectors) {
            if (selectorIsSoleOrphan(sel)) {
                soleOrphan.push(sel);
            } else if (selectorReferencesOrphan(sel)) {
                referencesOrphan.push(sel);
            } else {
                keep.push(sel);
            }
        }

        // Decision:
        // - If ALL selectors are sole-orphan: delete entire rule
        // - If SOME selectors are sole-orphan and others are keep/refs:
        //   strip the sole-orphan selectors, keep the rest
        // - If no sole-orphan selectors: do nothing
        if (soleOrphan.length === 0) return;

        if (keep.length === 0 && referencesOrphan.length === 0) {
            // All selectors targeted the orphan alone — delete entire rule
            list.remove(item);
            rulesDeleted++;
        } else {
            // Multi-selector rule — strip only the sole-orphan selectors
            node.prelude.children = new csstree.List();
            for (const sel of [...keep, ...referencesOrphan]) {
                node.prelude.children.appendData(sel);
            }
            selectorsStripped += soleOrphan.length;
        }
    }
});

const output = csstree.generate(ast);
const removed = originalLen - output.length;

process.stderr.write(`AST deletion: ${originalLen} -> ${output.length} bytes (-${removed}, ${(100 * removed / originalLen).toFixed(1)}%)\n`);
process.stderr.write(`  Rules fully deleted: ${rulesDeleted}\n`);
process.stderr.write(`  Selectors stripped from multi-selector rules: ${selectorsStripped}\n`);

process.stdout.write(output);
