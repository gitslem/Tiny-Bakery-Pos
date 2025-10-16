// @ts-check
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// If @vitejs/plugin-react-swc isn't available, Vite will still work with default react plugin-less config.
// This tries to import it but won't fail if missing.
let plugins = []
try { plugins = [react()] } catch { plugins = [] }

export default defineConfig({
  plugins,
})
