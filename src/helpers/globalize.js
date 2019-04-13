import { isString, isFunction } from './is'
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
  if (isString(handler)) {
    return handler
  }

  globalThis[name] = (...args) => {
    if (once) {
      delete globalThis[name]
    }

    if (isFunction(handler)) {
      return handler(...args)
    }

    return
  }

  return name
}

export default globalize
