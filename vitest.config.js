import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'
dotenv.config({
  path: '.env.development',
})

import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      infra: path.resolve(__dirname, './infra'),
      tests: path.resolve(__dirname, './tests'),
      models: path.resolve(__dirname, './models'),
    },
  },
  test: {
    globals: false,
  },
})
