import { defaultKeymap } from '@codemirror/commands';
import { Facet, Prec, EditorState } from '@codemirror/state';
import { keymap, ViewPlugin } from '@codemirror/view';
// import { searchKeymap } from '@codemirror/search';
import { emacs } from '@replit/codemirror-emacs';
import { vim, Vim } from '@replit/codemirror-vim';
// import { vim } from './vim_test.mjs';
import { vscodeKeymap } from '@replit/codemirror-vscode-keymap';

// Per-editor way to plumb down { onEvaluate, onStop }, provided by initEditor.
export const editorActions = Facet.define({ combine: (values) => values[0] ?? {} });

const vscodePlugin = ViewPlugin.fromClass(
  class {
    constructor() {}
  },
  {
    provide: () => {
      return Prec.highest(keymap.of([...vscodeKeymap]));
    },
  },
);
const vscodeExtension = (options) => [vscodePlugin].concat(options ?? []);

const keymaps = {
  vim,
  emacs,
  codemirror: () => keymap.of(defaultKeymap),
  vscode: vscodeExtension,
};

export { Vim }; // export for patterns/prebake to define custom actions

Vim.defineEx('write', 'w', (cm) => cm.cm6.state.facet(editorActions).onEvaluate?.());
Vim.defineEx('quit', 'q', (cm) => cm.cm6.state.facet(editorActions).onStop?.());

export function keybindings(name) {
  const active = keymaps[name];
  const extensions = active ? [Prec.high(active())] : [];
  if (name === 'vim') {
    extensions.push(EditorState.allowMultipleSelections.of(true));
  }
  return extensions;
}
