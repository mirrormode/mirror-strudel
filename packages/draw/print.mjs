/*
print.mjs - prints hap values to the console or a scrollable inline widget
Copyright (C) 2022 Strudel contributors - see
<https://codeberg.org/uzu/strudel/src/branch/main/packages/draw/print.mjs> This
program is free software: you can redistribute it and/or modify it under the
terms of the GNU Affero General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version. This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for
more details. You should have received a copy of the GNU Affero General Public
License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { logger, Pattern, stringifyValues } from '@strudel/core';

const printed = {};

// counts .print() calls within one synchronous evaluation, then resets for the
// next
let printIndex = 0;
let printIndexResetQueued = false;
function nextPrintIndex() {
  const index = printIndex++;
  if (!printIndexResetQueued) {
    printIndexResetQueued = true;
    queueMicrotask(() => {
      printIndex = 0;
      printIndexResetQueued = false;
    });
  }
  return index;
}

function formatTime(hap, round, padding) {
  const begin = hap.wholeOrPart().begin;
  if (round === 0) {
    return String(begin.sam().valueOf()).padEnd(padding);
  }
  const factor = 10 ** round;
  const time = Math.round(begin.valueOf() * factor) / factor;
  return String(time).padEnd(padding + round + 1);
}

function appendLine(el, text, maxLines) {
  const line = document.createElement('div');
  line.textContent = text;
  el.appendChild(line);
  while (el.childElementCount > maxLines) {
    el.removeChild(el.firstChild);
  }
  if (el.follow) {
    el.scrollTop = el.scrollHeight;
  }
}

/**
 * Prints the values of a pattern's events. Without a leading underscore, prints
 * to the existing console panel, labeled with its position among other
 * `print()` calls, e.g. `[print(line:1)]`. With the `_` prefix, it shows a
 * scrollable widget inside the code instead, and its content resets on
 * every (re-)evaluation.
 *
 * @name print
 * @tags visualization
 * @param {number} width widget width in px, `_print` only. defaults to 600
 * @param {number} height widget height in px, `_print` only. defaults to 100
 * @param {number} maxLines max lines kept, `_print` only. defaults to 500
 * @param {number} round decimal digits for the event time. defaults to 4. `0`
 *     shows only the cycle
 * @param {number} padding integer digits reserved for the cycle, so it stays
 *     aligned once cycles reach 10 or 100. defaults to 3
 * @example
 * s("bd sd hh cp").print()
 * @example
 * s("bd sd hh*2 cp")._print({ round: 5 })
 */
Pattern.prototype.print = function (options = {}) {
  const { el, id = 1, maxLines = 500, round = 4, padding = 3 } = options;
  if (!el) {
    const label = `print(line:${nextPrintIndex() + 1})`;
    return this.onTrigger((hap) => {
      logger(`[${label}] ${formatTime(hap, round, padding)}: ${stringifyValues(hap.value, true)}`);
    }, false);
  }
  printed[id] = new WeakSet();
  return this.draw(
    (haps) => {
      haps
        .filter((hap) => !printed[id].has(hap))
        .forEach((hap) => {
          printed[id].add(hap);
          appendLine(el, `${formatTime(hap, round, padding)}: ${stringifyValues(hap.value, true)}`, maxLines);
        });
    },
    { lookbehind: 0, lookahead: 0, id },
  );
};
