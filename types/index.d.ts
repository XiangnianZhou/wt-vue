interface EventData {
  json: any,
  [key: string]: string
}

interface Mixin {
  readonly mounted: () => void
  readonly updated: () => void
}

export class Wt {
  track(event: string, data: EventData, isKeepalive?: boolean): void;
  login(loginId: string): void
  addIgnoreOrigin(origin: string): void
  addPubConfig(obj: {[key: string]: string}): void
  removePubConfig(key: string): void
}

export function createWt (): Wt
export function createWt (host?: string, project?: string, logstore?: string): Wt
export function initPerformance (host?: string, project?: string, logstore?: string, Vue?: any): Wt
export function initWt (host: string, project: string, logstore: string, Vue?: any, router?: any): Wt
export const wtMixin: Mixin
