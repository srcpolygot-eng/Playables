import { ZenokuApp } from './app';

window.addEventListener('DOMContentLoaded', () => {
  (window as unknown as { app: ZenokuApp }).app = new ZenokuApp();
});
