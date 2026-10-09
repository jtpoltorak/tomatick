import { Component, computed, HostListener, inject, output } from '@angular/core';
import { pickQuote, type Quote } from '../../../shared/quotes';
import { formatClock, PHASE_LABELS, type Phase } from '../../../shared/timer';
import { PomodoroStore } from '../pomodoro-store';

@Component({
  selector: 'app-timer-view',
  templateUrl: './timer-view.html',
  styleUrl: './timer-view.css',
})
export class TimerView {
  protected readonly store = inject(PomodoroStore);
  readonly openSettings = output<void>();

  protected readonly phases: { id: Phase; label: string }[] = [
    { id: 'work', label: PHASE_LABELS.work },
    { id: 'shortBreak', label: PHASE_LABELS.shortBreak },
    { id: 'longBreak', label: PHASE_LABELS.longBreak },
  ];

  private readonly phase = computed(() => this.store.state().phase);
  private lastQuote?: Quote;
  /** Re-picks only when the phase changes, not on every tick or settings save. */
  private readonly phaseQuote = computed(() => {
    this.lastQuote = pickQuote(this.phase(), this.lastQuote);
    return this.lastQuote;
  });
  // Anyone who turned quotes on has been through Settings and seen the alert
  // options, so the quote takes the alert hint's place and the popup stays short.
  protected readonly quote = computed(() =>
    this.store.settings().showQuotes ? this.phaseQuote() : null,
  );

  protected readonly clock = computed(() => formatClock(this.store.remainingMs()));
  // The bar empties as time passes, like sand running out.
  protected readonly percentLeft = computed(() => Math.round(100 * (1 - this.store.progress())));
  /** Whole minutes, so screen readers aren't flooded with a new value every second. */
  protected readonly timeLeftText = computed(() => {
    const total = Math.round(this.store.totalMs() / 60_000);
    const left = Math.ceil(this.store.remainingMs() / 60_000);
    return `${left} of ${total} ${total === 1 ? 'minute' : 'minutes'} left`;
  });

  protected readonly status = computed(() => {
    const { phase, status } = this.store.state();
    if (status === 'running') return phase === 'work' ? 'Stay focused' : 'Take a breather';
    if (status === 'paused') return 'Paused';
    return phase === 'work' ? 'Ready to focus' : 'Time for a break';
  });

  protected readonly primaryLabel = computed(() => {
    const status = this.store.state().status;
    return status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start';
  });

  protected readonly cycleDots = computed(() => {
    const done = this.store.state().completedInCycle;
    return Array.from(
      { length: this.store.settings().sessionsBeforeLongBreak },
      (_, i) => i < done,
    );
  });

  protected readonly cycleText = computed(() => {
    const total = this.cycleDots().length;
    return `${this.store.state().completedInCycle} of ${total} focus ${total === 1 ? 'session' : 'sessions'} done before a long break`;
  });

  protected toggle(): void {
    void this.store.send({ command: this.store.state().status === 'running' ? 'pause' : 'start' });
  }

  protected reset(): void {
    void this.store.send({ command: 'reset' });
  }

  protected skip(): void {
    void this.store.send({ command: 'skip' });
  }

  protected choosePhase(phase: Phase): void {
    if (phase !== this.store.state().phase) void this.store.send({ command: 'setPhase', phase });
  }

  @HostListener('document:keydown.space', ['$event'])
  protected onSpace(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, input, select, textarea')) return;
    event.preventDefault();
    this.toggle();
  }
}
