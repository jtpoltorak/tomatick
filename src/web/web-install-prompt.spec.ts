import { WebInstallPrompt } from './web-install-prompt';

function fakeInstallEvent() {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>;
    prompted: number;
  };
  event.prompted = 0;
  event.prompt = async () => {
    event.prompted++;
  };
  return event;
}

describe('WebInstallPrompt', () => {
  it('offers to install once the browser says it can, and prompts on click', async () => {
    const prompt = new WebInstallPrompt();
    window.dispatchEvent(new Event('appinstalled'));
    expect(prompt.available()).toBe(false);

    const event = fakeInstallEvent();
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(prompt.available()).toBe(true);

    await prompt.install();
    expect(event.prompted).toBe(1);
    expect(prompt.available()).toBe(false);
  });

  it('hides the button once the app is installed', () => {
    const prompt = new WebInstallPrompt();
    window.dispatchEvent(fakeInstallEvent());
    expect(prompt.available()).toBe(true);

    window.dispatchEvent(new Event('appinstalled'));
    expect(prompt.available()).toBe(false);
  });
});
