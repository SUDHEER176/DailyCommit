import { describe, it, expect } from 'vitest';
import { readSignature } from '../signature';
import { PROBLEMS } from './fixtures';

const names = (sig) => sig.params.map((p) => p.name);
const kinds = (sig) => sig.params.map((p) => p.kind);

describe('readSignature', () => {
  it('reads the method from every language\'s starter code', () => {
    for (const language of ['javascript', 'python', 'cpp', 'java']) {
      const sig = readSignature(language, PROBLEMS.twoSum.starterTemplates[language]);
      expect(sig, language).toMatchObject({ name: 'twoSum', returnsVoid: false });
      expect(names(sig), language).toEqual(['nums', 'target']);
    }
  });

  it('keeps the type text as written', () => {
    expect(readSignature('cpp', PROBLEMS.twoSum.starterTemplates.cpp).params[0].type).toBe('vector<int>&');
    expect(readSignature('java', PROBLEMS.twoSum.starterTemplates.java).params[0].type).toBe('int[]');
    expect(readSignature('python', PROBLEMS.twoSum.starterTemplates.python).params[0].type).toBe('List[int]');
  });

  it('marks linked lists and trees', () => {
    for (const language of ['javascript', 'python', 'cpp', 'java']) {
      expect(kinds(readSignature(language, PROBLEMS.reverseList.starterTemplates[language])), language).toEqual(['list']);
      expect(kinds(readSignature(language, PROBLEMS.maxDepth.starterTemplates[language])), language).toEqual(['tree']);
    }
  });

  it('reads pointer parameters written with a space, as in hasCycle(ListNode *head)', () => {
    const sig = readSignature('cpp', PROBLEMS.hasCycle.starterTemplates.cpp);
    expect(sig).toMatchObject({ name: 'hasCycle', returnType: 'bool' });
    expect(sig.params[0]).toMatchObject({ name: 'head', kind: 'list' });
  });

  it('spots methods that return nothing', () => {
    for (const language of ['javascript', 'python', 'cpp', 'java']) {
      expect(readSignature(language, PROBLEMS.reverseString.starterTemplates[language]).returnsVoid, language).toBe(true);
    }
  });

  it('returns null when there is no method to find', () => {
    expect(readSignature('python', '')).toBeNull();
    expect(readSignature('python', 'x = 1')).toBeNull();
    expect(readSignature('ruby', 'def f; end')).toBeNull();
  });
});
