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

const globalize = (
  handler,
  { name = uniqueId('__globalFunction'), once = false } = {}
) => {
  if (isString(handler)) {
    return handler
  }

  getGlobal()[name] = (...args) => {
    if (once) {
      delete getGlobal()[name]
    }

    if (isFunction(handler)) {
      return handler(...args)
    }

    return
  }

  return name
}

globalize.getGlobal = getGlobal

export default globalize
