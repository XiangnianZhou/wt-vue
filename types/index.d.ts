interface EventData {
  [key: string]: string
}

interface Mixin {
  readonly mounted: () => void
  readonly updated: () => void
}

export class Wt {
  track(event: string, data: EventData): void;
  login(loginId: string): void
}

export function createWt (): Wt
export function initWt (host: string, project: string, logstore: string): Wt
export const wtMixin: Mixin
