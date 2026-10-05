import { Component, computed, HostListener, inject, output } from '@angular/core';
import { formatClock, PHASE_LABELS, type Phase } from '../../../shared/timer';
import { PomodoroStore } from '../pomodoro-store';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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

  protected readonly radius = RADIUS;
  protected readonly circumference = CIRCUMFERENCE;
  // The ring empties as time passes, like sand running out.
  protected readonly dashOffset = computed(() => CIRCUMFERENCE * this.store.progress());
  protected readonly clock = computed(() => formatClock(this.store.remainingMs()));

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
