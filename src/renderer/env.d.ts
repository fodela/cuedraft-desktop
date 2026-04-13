import type { CueDraftAPI } from '../preload/index'

declare module '*.png' {
  const src: string
  export default src
}

declare const __APP_VERSION__: string

declare global {
  interface Window {
    cuedraft: CueDraftAPI
  }
}
