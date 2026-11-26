/*
controls.test.mjs - <short description TODO>
Copyright (C) 2023 Strudel contributors - see <https://codeberg.org/uzu/strudel/src/branch/main/packages/core/test/controls.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { s, pan, getControlName } from '../controls.mjs';
import { mini } from '../../mini/mini.mjs';
import { describe, it, expect } from 'vitest';
import { Fraction, sequence, pure, fast, stack } from '@strudel/pattern';
import { sameFirst } from '../../pattern/test/pattern.test.mjs';

describe('controls', () => {
  it('should support controls', () => {
    expect(s('bd').firstCycleValues).toEqual([{ s: 'bd' }]);
  });
  it('should support compound controls', () => {
    expect(s(mini('bd:3')).firstCycleValues).toEqual([{ s: 'bd', n: 3 }]);
    expect(s(mini('bd:3 sd:4:1.4')).firstCycleValues).toEqual([
      { s: 'bd', n: 3 },
      { s: 'sd', n: 4, gain: 1.4 },
    ]);
  });
  it('should support ignore extra elements in compound controls', () => {
    expect(s(mini('bd:3:0.4 sd:4:0.5:3:17')).firstCycleValues).toEqual([
      { s: 'bd', n: 3, gain: 0.4 },
      { s: 'sd', n: 4, gain: 0.5 },
    ]);
  });
  it('should support nested controls', () => {
    expect(s(mini('bd').pan(1)).firstCycleValues).toEqual([{ s: 'bd', pan: 1 }]);
    expect(s(mini('bd:1').pan(1)).firstCycleValues).toEqual([{ s: 'bd', n: 1, pan: 1 }]);
  });
  it('preserves step count of the left pattern', () => {
    expect(s(mini('bd cp mt').pan(mini('1 2 3 4')))._steps).toEqual(Fraction(3));
  });
  it('preserves step count of the right pattern for .out', () => {
    expect(s(mini('bd cp mt').set.out(pan(mini('1 2 3 4'))))._steps).toEqual(Fraction(4));
  });
  it('combines step count of the pattern for .mix as lcm', () => {
    expect(s(mini('bd cp mt').set.mix(pan(mini('1 2 3 4'))))._steps).toEqual(Fraction(12));
  });
  it('finds control name by alias', () => {
    expect(getControlName('lpf')).toEqual('cutoff');
    expect(getControlName('cutoff')).toEqual('cutoff');
  });
});

describe('chop', () => {
  it('Can _chop(2)', () => {
    expect(sequence({ sound: 'a' }, { sound: 'b' })._chop(2).firstCycle()).toStrictEqual(
      sequence(
        { sound: 'a', begin: 0, end: 0.5 },
        { sound: 'a', begin: 0.5, end: 1 },
        { sound: 'b', begin: 0, end: 0.5 },
        { sound: 'b', begin: 0.5, end: 1 },
      ).firstCycle(),
    );
  });
  it('Can chop(2,3)', () => {
    expect(pure({ sound: 'a' }).fast(2).chop(2, 3).sortHapsByPart().firstCycle()).toStrictEqual(
      sequence(
        [
          { sound: 'a', begin: 0, end: 0.5 },
          { sound: 'a', begin: 0.5, end: 1 },
        ],
        [
          { sound: 'a', begin: 0, end: 1 / 3 },
          { sound: 'a', begin: 1 / 3, end: 2 / 3 },
          { sound: 'a', begin: 2 / 3, end: 1 },
        ],
      )
        .sortHapsByPart()
        .firstCycle(),
    );
  });
  it('Can chop chops', () => {
    expect(pure({ s: 'bev' }).chop(2).chop(2).firstCycle()).toStrictEqual(pure({ s: 'bev' }).chop(4).firstCycle());
  });
});

describe('loopAt', () => {
  it('maintains steps', () => {
    expect(s('bev').chop(8).loopAt(2)._steps).toStrictEqual(Fraction(4));
  });
});

describe('_steps', () => {
  it('Is correctly preserved/calculated through transformations', () => {
    expect(sequence({ n: 0 }, { n: 1 }, { n: 2 }).chop(4)._steps).toStrictEqual(Fraction(12));
    expect(sequence(0, 1, 2, 3).hurry(4)._steps).toStrictEqual(Fraction(4));
    expect(sequence({ s: 'bev' }, { s: 'amenbreak' }).chop(4)._steps).toStrictEqual(Fraction(8));
    expect(sequence({ s: 'bev' }, { s: 'amenbreak' }).striate(4)._steps).toStrictEqual(Fraction(8));
    expect(sequence({ s: 'bev' }, { s: 'amenbreak' }).slice(4, sequence(0, 1, 2, 3))._steps).toStrictEqual(Fraction(4));
    expect(sequence({ s: 'bev' }, { s: 'amenbreak' }).splice(4, sequence(0, 1, 2, 3))._steps).toStrictEqual(
      Fraction(4),
    );
  });
});

describe('hurry', () => {
  it('Can speed up patterns and sounds', () => {
    sameFirst(s(sequence('a', 'b')).hurry(2), s(sequence('a', 'b')).fast(2).set({ speed: 2 }));
  });
});

describe('jux', () => {
  it('Can juxtapose', () => {
    expect(pure({ a: 1 }).jux(fast(2)).sortHapsByPart().firstCycle()).toStrictEqual(
      stack(pure({ a: 1, pan: 0 }), pure({ a: 1, pan: 1 }).fast(2))
        .sortHapsByPart()
        .firstCycle(),
    );
  });
});
describe('juxBy', () => {
  it('Can juxtapose by half', () => {
    expect(pure({ a: 1 }).juxBy(0.5, fast(2)).sortHapsByPart().firstCycle()).toStrictEqual(
      stack(pure({ a: 1, pan: 0.25 }), pure({ a: 1, pan: 0.75 }).fast(2))
        .sortHapsByPart()
        .firstCycle(),
    );
  });
});

describe('striate', () => {
  it('Can striate(2)', () => {
    sameFirst(
      sequence({ sound: 'a' }).striate(2),
      sequence({ sound: 'a', begin: 0, end: 0.5 }, { sound: 'a', begin: 0.5, end: 1 }),
    );
  });
});

describe('slice', () => {
  it('Can slice a sample', () => {
    sameFirst(
      s('break').slice(4, sequence(0, 1, 2, 3)),
      sequence(
        { begin: 0, end: 0.25, s: 'break', _slices: 4 },
        { begin: 0.25, end: 0.5, s: 'break', _slices: 4 },
        { begin: 0.5, end: 0.75, s: 'break', _slices: 4 },
        { begin: 0.75, end: 1, s: 'break', _slices: 4 },
      ),
    );
  });
});

describe('splice', () => {
  it('Can splice a sample', () => {
    sameFirst(
      s('break').splice(4, sequence(0, 1, 2, 3)),
      sequence(
        { begin: 0, end: 0.25, s: 'break', _slices: 4, unit: 'c', speed: 1 },
        { begin: 0.25, end: 0.5, s: 'break', _slices: 4, unit: 'c', speed: 1 },
        { begin: 0.5, end: 0.75, s: 'break', _slices: 4, unit: 'c', speed: 1 },
        { begin: 0.75, end: 1, s: 'break', _slices: 4, unit: 'c', speed: 1 },
      ),
    );
  });
});
