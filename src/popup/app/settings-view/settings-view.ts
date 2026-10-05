import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { playSound } from '../../../shared/sounds';
import {
  DEFAULT_SETTINGS,
  sanitizeSettings,
  SOUND_LABELS,
  type Settings,
  type SoundId,
} from '../../../shared/timer';
import { PomodoroStore } from '../pomodoro-store';

@Component({
  selector: 'app-settings-view',
  imports: [ReactiveFormsModule],
  templateUrl: './settings-view.html',
  styleUrl: './settings-view.css',
})
export class SettingsView {
  private readonly store = inject(PomodoroStore);
  private readonly fb = inject(FormBuilder).nonNullable;
  private audio?: AudioContext;

  protected readonly sounds = Object.entries(SOUND_LABELS) as [SoundId, string][];
  protected readonly saved = signal(false);

  protected readonly durations = [
    { key: 'workMinutes', label: 'Focus', max: 180 },
    { key: 'shortBreakMinutes', label: 'Short break', max: 60 },
    { key: 'longBreakMinutes', label: 'Long break', max: 120 },
  ] as const;

  protected readonly form = this.fb.group({
    workMinutes: [0, [Validators.required, Validators.min(1), Validators.max(180)]],
    shortBreakMinutes: [0, [Validators.required, Validators.min(1), Validators.max(60)]],
    longBreakMinutes: [0, [Validators.required, Validators.min(1), Validators.max(120)]],
    sessionsBeforeLongBreak: [0, [Validators.required, Validators.min(1), Validators.max(12)]],
    autoStartBreaks: [false],
    autoStartWork: [false],
    notificationsEnabled: [false],
    soundEnabled: [false],
    sound: ['bell' as SoundId],
    volumePercent: [70],
  });

  constructor() {
    this.form.setValue(this.toForm(this.store.settings()), { emitEvent: false });

    let savedTimer: ReturnType<typeof setTimeout> | undefined;
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(savedTimer);
      void this.audio?.close();
    });

    // Changes save as you go, so there's no Save button to forget.
    this.form.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      if (this.form.invalid) return;
      void this.store.updateSettings(this.fromForm()).then(() => {
        this.saved.set(true);
        clearTimeout(savedTimer);
        savedTimer = setTimeout(() => this.saved.set(false), 1500);
      });
    });
  }

  protected step(
    key: 'workMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'sessionsBeforeLongBreak',
    delta: number,
  ): void {
    const control = this.form.controls[key];
    const next = sanitizeSettings({ ...this.fromForm(), [key]: (control.value || 0) + delta })[key];
    control.setValue(next);
  }

  protected async preview(): Promise<void> {
    this.audio ??= new AudioContext();
    await this.audio.resume();
    const { sound, volumePercent } = this.form.getRawValue();
    await playSound(this.audio, sound, volumePercent / 100);
  }

  protected restoreDefaults(): void {
    this.form.setValue(this.toForm(DEFAULT_SETTINGS));
  }

  private toForm(s: Settings) {
    const { volume, ...rest } = s;
    return { ...rest, volumePercent: Math.round(volume * 100) };
  }

  private fromForm(): Settings {
    const { volumePercent, ...rest } = this.form.getRawValue();
    return sanitizeSettings({ ...rest, volume: volumePercent / 100 });
  }
}
