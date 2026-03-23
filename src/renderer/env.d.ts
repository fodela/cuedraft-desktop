import type { CueDraftAPI } from '../preload/index'

declare global {
  interface Window {
    cuedraft: CueDraftAPI
  }
}
