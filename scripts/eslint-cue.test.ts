import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ESLint } from 'eslint';

const filePath = 'basic/src/flex-playground.cc.vue';

await test('Cue scripts use TypeScript rules and report original source locations', async () => {
  const eslint = new ESLint();
  const [result] = await eslint.lintText([
    '<script setup lang="ts">',
    'const value: any = 1;',
    '</script>',
    '<template><div>{{ value }}</div></template>',
  ].join('\n'), { filePath });
  const diagnostic = result.messages.find((message) =>
    message.ruleId === '@typescript-eslint/no-explicit-any',
  );
  assert.ok(diagnostic);
  assert.equal(diagnostic.line, 2);
  assert.equal(diagnostic.column, 14);
});

await test('Cue scripts retain type-aware promise checks', async () => {
  const eslint = new ESLint();
  const [result] = await eslint.lintText([
    '<script setup lang="ts">',
    'Promise.resolve();',
    '</script>',
    '<template><div>Ready</div></template>',
  ].join('\n'), { filePath });
  assert.ok(result.messages.some((message) =>
    message.ruleId === '@typescript-eslint/no-floating-promises' && message.line === 2,
  ));
});

await test('Cue autofixes keep template text and fix the original script offsets', async () => {
  const eslint = new ESLint({ fix: true });
  const template = '<template><div>Before <span>inside</span> after.</div>'
    + '<div>{{ count }}</div></template>';
  const [result] = await eslint.lintText([
    '<script setup lang="ts">',
    'let count = 1;',
    'if (count) count++;',
    'console.log(count);',
    '</script>',
    template,
  ].join('\n'), { filePath });
  assert.equal(result.errorCount, 0);
  assert.ok(result.output);
  assert.match(result.output, /if \(count\) \{\n {2}count\+\+;\n\}/u);
  assert.ok(result.output.includes('Before <span>inside</span> after.'));
});
