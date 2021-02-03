interface EventData {
  [key: string]: string
}

interface Vue {
  [key: string]: string
}

interface Mixin {
  readonly mounted: () => void
  readonly updated: () => void
}

export class Wt {
  track(event: string, data: EventData, isKeepalive?: boolean): void;
  login(loginId: string): void
}

export function createWt (): Wt
export function createWt (host?: string, project?: string, logstore?: string): Wt
export function initPerformace (host?: string, project?: string, logstore?: string): Wt
export function creatVueWt(vueInstance: Vue): Wt
export function initWt (host: string, project: string, logstore: string, Vue?: any, router?: any): Wt
export const wtMixin: Mixin
