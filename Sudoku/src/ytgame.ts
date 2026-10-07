/** YouTube Playables SDK thin wrapper (no-op outside Playables) */

declare global {
  interface Window {
    ytgame?: YtGameApi;
  }
}

interface YtGameApi {
  IN_PLAYABLES_ENV?: boolean;
  game?: {
    firstFrameReady?: () => void;
    gameReady?: () => void;
    loadData?: () => Promise<string>;
    saveData?: (data: string) => Promise<void>;
  };
  system?: {
    isAudioEnabled?: () => boolean;
    onAudioEnabledChange?: (cb: (enabled: boolean) => void) => void;
    onPause?: (cb: () => void) => void;
    onResume?: (cb: () => void) => void;
  };
  engagement?: {
    sendScore?: (opts: { value: number }) => void;
  };
}

export const YT = {
  get api(): YtGameApi | undefined {
    return typeof window !== 'undefined' ? window.ytgame : undefined;
  },

  get inPlayables(): boolean {
    return !!this.api?.IN_PLAYABLES_ENV;
  },

  firstFrameReady(): void {
    try {
      this.api?.game?.firstFrameReady?.();
    } catch {
      /* ignore */
    }
  },

  gameReady(): void {
    try {
      this.api?.game?.gameReady?.();
    } catch {
      /* ignore */
    }
  },

  isAudioEnabled(): boolean {
    try {
      if (this.api?.system?.isAudioEnabled) return this.api.system.isAudioEnabled();
    } catch {
      /* ignore */
    }
    return true;
  },

  onAudioEnabledChange(cb: (enabled: boolean) => void): void {
    try {
      this.api?.system?.onAudioEnabledChange?.(cb);
    } catch {
      /* ignore */
    }
  },

  onPause(cb: () => void): void {
    try {
      this.api?.system?.onPause?.(cb);
    } catch {
      /* ignore */
    }
  },

  onResume(cb: () => void): void {
    try {
      this.api?.system?.onResume?.(cb);
    } catch {
      /* ignore */
    }
  },

  sendScore(value: number): void {
    try {
      this.api?.engagement?.sendScore?.({ value: Math.max(0, Math.floor(value)) });
    } catch {
      /* ignore */
    }
  },

  async loadCloud(): Promise<string | null> {
    try {
      if (!this.api?.game?.loadData) return null;
      return await this.api.game.loadData();
    } catch {
      return null;
    }
  },

  async saveCloud(data: string): Promise<void> {
    try {
      await this.api?.game?.saveData?.(data);
    } catch {
      /* ignore */
    }
  },
};
