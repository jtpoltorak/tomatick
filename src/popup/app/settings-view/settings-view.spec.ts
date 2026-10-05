import { TestBed } from '@angular/core/testing';
import { createFakeStore, provideFakeStore } from '../testing';
import { SettingsView } from './settings-view';

describe('SettingsView', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  async function setup() {
    const store = createFakeStore();
    TestBed.configureTestingModule({
      imports: [SettingsView],
      providers: [provideFakeStore(store)],
    });
    const fixture = TestBed.createComponent(SettingsView);
    fixture.detectChanges();
    return { store, fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('starts from the classic defaults with alerts off', async () => {
    const { el } = await setup();
    expect((el.querySelector('#workMinutes') as HTMLInputElement).value).toBe('25');
    expect((el.querySelector('#shortBreakMinutes') as HTMLInputElement).value).toBe('5');
    expect((el.querySelector('#longBreakMinutes') as HTMLInputElement).value).toBe('15');
    const switches = Array.from(el.querySelectorAll<HTMLInputElement>('input[role=switch]'));
    expect(switches.every((s) => !s.checked)).toBe(true);
    expect(el.querySelector('#sound')).toBeNull();
  });

  it('saves changes automatically, including the stepper buttons', async () => {
    const { store, el, fixture } = await setup();
    (el.querySelector('[aria-label="Increase Focus"]') as HTMLButtonElement).click();
    vi.advanceTimersByTime(400);
    await fixture.whenStable();
    expect(store.settings().workMinutes).toBe(26);
  });

  it('reveals sound options when sound is turned on', async () => {
    const { store, el, fixture } = await setup();
    const soundSwitch = el.querySelector<HTMLInputElement>('input[formcontrolname=soundEnabled]')!;
    soundSwitch.click();
    fixture.detectChanges();
    expect(el.querySelector('#sound')).toBeTruthy();
    vi.advanceTimersByTime(400);
    await fixture.whenStable();
    expect(store.settings().soundEnabled).toBe(true);
  });
});
