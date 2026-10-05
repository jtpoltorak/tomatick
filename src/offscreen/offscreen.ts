import type { PlaySoundMessage } from '../shared/messages';
import { playSound } from '../shared/sounds';

const ctx = new AudioContext();

chrome.runtime.onMessage.addListener((message: PlaySoundMessage, _sender, sendResponse) => {
  if (message?.target !== 'offscreen' || message.type !== 'play-sound') return false;
  void ctx
    .resume()
    .then(() => playSound(ctx, message.sound, message.volume))
    .finally(() => sendResponse(true));
  return true;
});
