import ts from 'typescript-eslint';

// Vue's parser and template rules recognize SFCs by the .vue extension.
// Keep source offsets intact while giving .cue files a virtual .vue filename.
export const cueProcessor = {
  /** @param {string} source */
  preprocess(source) {
    return [{ text: source, filename: 'component.vue' }];
  },
  /** @param {import('eslint').Linter.LintMessage[][]} messages */
  postprocess(messages) {
    return messages[0];
  },
  supportsAutofix: true,
};

/** @type {typeof ts.parser} */
export const cueScriptParser = {
  ...ts.parser,
  parseForESLint(source, options) {
    // TypeScript must check the actual .cue file in tsconfig.eslint.json.
    return ts.parser.parseForESLint(source, {
      ...options,
      filePath: options?.filePath?.replace(/\.cue\/\d+_component\.vue$/u, '.cue'),
    });
  },
};
