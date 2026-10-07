import { ZenokuApp } from './app';
import { YT } from './ytgame';
import { unlockAudio } from './audio';

YT.firstFrameReady();

window.addEventListener('DOMContentLoaded', () => {
  const app = new ZenokuApp();
  (window as unknown as { app: ZenokuApp }).app = app;
  YT.gameReady();

  const unlock = () => {
    unlockAudio();
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
});
