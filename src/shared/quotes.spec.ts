import { BREAK_QUOTES, FOCUS_QUOTES, pickQuote } from './quotes';

describe('quotes', () => {
  it('has a few dozen distinct, attributed quotes', () => {
    const all = [...FOCUS_QUOTES, ...BREAK_QUOTES];
    expect(all.length).toBeGreaterThanOrEqual(25);
    expect(new Set(all.map((q) => q.text)).size).toBe(all.length);
    for (const q of all) {
      expect(q.text && q.author && q.source).toBeTruthy();
    }
  });

  it('picks focus quotes for focus and rest quotes for breaks', () => {
    expect(FOCUS_QUOTES).toContain(pickQuote('work'));
    expect(BREAK_QUOTES).toContain(pickQuote('shortBreak'));
    expect(BREAK_QUOTES).toContain(pickQuote('longBreak'));
  });

  it('never repeats the quote already showing', () => {
    const shown = FOCUS_QUOTES[0];
    for (let i = 0; i < 20; i++) {
      expect(pickQuote('work', shown, () => i / 20)).not.toBe(shown);
    }
  });
});
