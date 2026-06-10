// Konva's Node build (loaded because its package `main` is the node entry)
// hard-requires the native `canvas` module, which can't build in this
// environment. Konva only reads `DOMMatrix` from it and — since jsdom defines
// `global.document` — skips the node-canvas element overrides, using jsdom's
// canvas instead. So intercept Node's `require('canvas')` and return a tiny
// shim. This runs before any test file imports react-konva.
import Module from 'node:module'

const canvasShim = {
  DOMMatrix: (globalThis as { DOMMatrix?: unknown }).DOMMatrix ?? class {},
  createCanvas: (w = 300, h = 300) => {
    if (typeof document !== 'undefined') {
      const el = document.createElement('canvas')
      el.width = w
      el.height = h
      return el
    }
    return { width: w, height: h, getContext: () => null }
  },
  Image: (globalThis as { Image?: unknown }).Image ?? class {},
}

const loader = Module as unknown as {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown
}
const originalLoad = loader._load
loader._load = function (request, parent, isMain) {
  if (request === 'canvas') return canvasShim
  return originalLoad.call(this, request, parent, isMain)
}

// jsdom's canvas has no real 2D context; give Konva a no-op one so rendering
// (the app asserts on HTML, not pixels) doesn't throw.
if (typeof HTMLCanvasElement !== 'undefined') {
  const noop = () => undefined
  const ctx = new Proxy(
    { measureText: () => ({ width: 0 }), getImageData: () => ({ data: [] }), canvas: null },
    { get: (target, prop) => (prop in target ? (target as Record<string, unknown>)[prop] : noop) },
  )
  // @ts-expect-error override jsdom's unimplemented getContext
  HTMLCanvasElement.prototype.getContext = () => ctx
}
