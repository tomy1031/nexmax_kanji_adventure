import { describe, expect, it } from 'vitest';
import { spokenText } from './speech';

describe('よみあげ', () => {
  it('says the kana of a line without its pictures', () => {
    expect(spokenText('きょうは なんようび？ だれも わかりません……😰')).toBe('きょうは なんようび？ だれも わかりません……');
    expect(spokenText('✍️💡🪧 かきます！')).toBe('かきます！');
    expect(spokenText('日(にち)、月(げつ)')).toBe('にち、げつ');
  });
});
