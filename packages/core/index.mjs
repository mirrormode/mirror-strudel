/*
index.mjs - <short description TODO>
Copyright (C) 2025 Strudel contributors - see <https://codeberg.org/uzu/strudel/src/branch/main/packages/core/index.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as controls from './controls.mjs'; // legacy
import createClock from './zyklus.mjs';
import { Pattern } from '@strudel/pattern';
export { controls, createClock };
export * from '@strudel/pattern';
export * from './controls.mjs';
export * from './cyclist.mjs';
export * from './repl.mjs';
export * from './speak.mjs';
export * from './schedulerState.mjs';
export * from './ui.mjs';
export * from './evaluate.mjs';
import { getClockTime } from './schedulerState.mjs';

// legacy:
Pattern.prototype.onTrigger = function (onTrigger, dominant = true) {
  console.warn('onTrigger is deprecated.. use onSchedule(hap, time, cps) instead');
  return this.onSchedule((hap, t, cps) => {
    const currentTime = getClockTime();
    return onTrigger(hap, currentTime, cps, t);
  }, dominant);
};

/**
 *
 * make something happen on event time
 * uses browser timeout which is innacurate for audio tasks
 * @param {Function} func
 * @name onTriggerTime
 * @tags external_io
 * @memberof Pattern.prototype
 * @returns {Pattern}
 * @example
 * s("bd!8").onTriggerTime((hap) => {console.log(hap)})
 */
Pattern.prototype.onTriggerTime = function (func) {
  return this.onSchedule((hap, targetTime) => {
    const diff = targetTime - getClockTime();
    setTimeout(() => {
      func(hap);
    }, diff * 1000);
  }, false);
};
