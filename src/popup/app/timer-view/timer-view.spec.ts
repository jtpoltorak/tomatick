import { TestBed } from '@angular/core/testing';
import { createFakeStore, provideFakeStore } from '../testing';
import { TimerView } from './timer-view';

async function setup(overrides = {}) {
  const store = createFakeStore(overrides);
  TestBed.configureTestingModule({ imports: [TimerView], providers: [provideFakeStore(store)] });
  const fixture = TestBed.createComponent(TimerView);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const button = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === text)!;
  return { store, fixture, el, button };
}

describe('TimerView', () => {
  it('shows a fresh 25:00 focus session ready to start', async () => {
    const { el, button } = await setup();
    expect(el.querySelector('.clock')?.textContent).toBe('25:00');
    expect(el.querySelector('.phase-pill.active')?.textContent?.trim()).toBe('Focus');
    expect(button('Start')).toBeTruthy();
  });

  it('shows time left as a progress bar below the clock', async () => {
    const { el } = await setup({ remainingMs: 10 * 60_000 });
    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-label')).toBe('Time left');
    expect(bar.getAttribute('aria-valuetext')).toBe('10 of 25 minutes left');
    expect(el.querySelector('.clock')?.nextElementSibling).toBe(bar);
    expect(el.querySelector('.cycle')?.getAttribute('aria-label')).toBe(
      '0 of 4 focus sessions done before a long break',
    );
  });

  it('starts and pauses through the main button', async () => {
    const { store, fixture, button } = await setup();
    button('Start').click();
    expect(store.sent).toEqual([{ command: 'start' }]);

    store.state.update((s) => ({ ...s, status: 'running', endTime: Date.now() + s.remainingMs }));
    await fixture.whenStable();
    button('Pause').click();
    expect(store.sent.at(-1)).toEqual({ command: 'pause' });
  });

  it('switches phase from the pills, but not while running', async () => {
    const { store, fixture, button } = await setup();
    button('Short break').click();
    expect(store.sent).toEqual([{ command: 'setPhase', phase: 'shortBreak' }]);

    store.state.update((s) => ({ ...s, status: 'running', endTime: Date.now() + s.remainingMs }));
    await fixture.whenStable();
    expect(button('Long break').disabled).toBe(true);
  });

  it('suggests turning on alerts until dismissed', async () => {
    const { el, fixture, store } = await setup();
    expect(el.querySelector('.hint')).toBeTruthy();
    (el.querySelector('.hint .close') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(store.alertHintDismissed()).toBe(true);
    expect(el.querySelector('.hint')).toBeNull();
  });
});
