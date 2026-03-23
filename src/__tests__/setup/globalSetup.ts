import { mkdirSync } from 'fs'

export function setup() {
  mkdirSync('/tmp/cuedraft-test/userData', { recursive: true })
}
