import uniqueId from './uniqueId'

const getGlobal = () => {
  if (typeof self !== 'undefined') {
    return self
  }
  if (typeof window !== 'undefined') {
    return window
  }
  if (typeof global !== 'undefined') {
    return global
  }
  throw new Error('unable to locate global object')
}

const globalThis = getGlobal()

const globalize = (
  handler,
  { name = uniqueId('__globalFunction'), once = false } = {}
) => {
  if (typeof handler === 'string') {
    return handler
  }

  globalThis[name] = (...args) => {
    if (typeof handler === 'function') {
      handler(...args)
    }

    if (once) {
      delete globalThis[name]
    }
  }

  return name
}

export default globalize
