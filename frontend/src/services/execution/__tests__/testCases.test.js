import { describe, it, expect } from 'vitest';
import {
  decodeEntities, parseValue, parseInputs, isDesignCase, allowsAnyOrder, answersMatch, displayExpected,
} from '../testCases';

describe('decodeEntities', () => {
  it('undoes the HTML escaping in LeetCode statements', () => {
    expect(decodeEntities('&quot;abc&quot; &lt;&gt; &amp; &#39;x&#39; &#65;')).toBe('"abc" <> & \'x\' A');
  });
});

describe('parseValue', () => {
  it('reads JSON', () => {
    expect(parseValue('[1,2,3]')).toEqual([1, 2, 3]);
    expect(parseValue('"hi"')).toBe('hi');
    expect(parseValue(' 42 ')).toBe(42);
  });
  it('reads Python-style True, False and None', () => {
    expect(parseValue('[True,False,None]')).toEqual([true, false, null]);
  });
  it('reads escaped strings from statements', () => {
    expect(parseValue('[&quot;a&quot;,&quot;b&quot;]')).toEqual(['a', 'b']);
  });
  it('leaves an unquoted word as a string', () => {
    expect(parseValue('hello')).toBe('hello');
  });
});

describe('parseInputs', () => {
  it('reads the statement form, with commas inside brackets and strings', () => {
    expect(parseInputs('nums = [2,7,11,15], target = 9')).toEqual([
      { name: 'nums', value: [2, 7, 11, 15] },
      { name: 'target', value: 9 },
    ]);
    expect(parseInputs('s = "a,b", k = 2')).toEqual([{ name: 's', value: 'a,b' }, { name: 'k', value: 2 }]);
  });
  it('reads the named form split over lines', () => {
    expect(parseInputs('board = \n[[1,2]\n,[3,4]]')).toEqual([{ name: 'board', value: [[1, 2], [3, 4]] }]);
  });
  it('reads the raw form, one value per line', () => {
    expect(parseInputs('[2,7]\n9')).toEqual([{ name: null, value: [2, 7] }, { name: null, value: 9 }]);
  });
});

describe('isDesignCase', () => {
  it('spots an operations list with an arguments list of the same length', () => {
    expect(isDesignCase([{ value: ['MinStack', 'push'] }, { value: [[], [1]] }])).toBe(true);
  });
  it('rejects ordinary inputs', () => {
    expect(isDesignCase([{ value: [1, 2] }, { value: 3 }])).toBe(false);
    expect(isDesignCase([{ value: ['a', 'b'] }, { value: [[1]] }])).toBe(false); // lengths differ
  });
});

describe('answersMatch', () => {
  it('compares JSON values exactly by default', () => {
    expect(answersMatch('[0,1]', '[0,1]')).toBe(true);
    expect(answersMatch('[1,0]', '[0,1]')).toBe(false);
    expect(answersMatch('true', 'true')).toBe(true);
    expect(answersMatch('"abc"', '"abc"')).toBe(true);
  });
  it('compares decimals with a small tolerance', () => {
    expect(answersMatch('2.5', '2.50000')).toBe(true);
    expect(answersMatch('0.3333333', '0.33333')).toBe(true);
    expect(answersMatch('2.6', '2.5')).toBe(false);
  });
  it('accepts any order, at every level, only when allowed', () => {
    expect(answersMatch('[[3,1],[2]]', '[[2],[1,3]]', { anyOrder: true })).toBe(true);
    expect(answersMatch('[[3,1],[2]]', '[[2],[1,3]]')).toBe(false);
    expect(answersMatch('[1,2]', '[1,2,2]', { anyOrder: true })).toBe(false);
  });
  it('treats output that isn\'t JSON as text', () => {
    expect(answersMatch('hello', 'hello')).toBe(true);
  });
});

describe('allowsAnyOrder', () => {
  it('reads the statement', () => {
    expect(allowsAnyOrder({ contentHtml: '<p>You may return the answer in any order.</p>' })).toBe(true);
    expect(allowsAnyOrder({ contentHtml: 'Notice that the order of the output and the order of the triplets does not matter.' })).toBe(true);
    expect(allowsAnyOrder({ contentHtml: 'Return the indices.' })).toBe(false);
  });
});

describe('displayExpected', () => {
  it('decodes and trims', () => {
    expect(displayExpected(' [&quot;a&quot;] ')).toBe('["a"]');
  });
});
