/* global describe it */

import assert from 'assert';

import * as index from '../src';

describe('Resolver', () => {
  describe('exports', () => {
    const expected = [
      'client',
      'context',
      'resolve',
      'Resolver',
    ];

    it(`should export ${expected}`, () => {
      assert.deepEqual(Object.keys(index), expected);
    });
  });
});
