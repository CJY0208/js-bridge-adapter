import { isFunction } from '../helpers/is'
const parseConfig = config => {
  if (typeof config === 'function') {
    return {
      getExecutor: config
    }
  }

  return config
}

export default class DynamicFunction {
  constructor(config) {
    const { name = '', getExecutor } = parseConfig(config)

    const func = {
      [name](...args) {
        const executor = getExecutor.apply(this, args)

        if (!isFunction(executor)) {
          return
        }

        return executor.apply(this, args)
      }
    }[name]

    const commonPropertyProps = {
      configurable: true,
      enumerable: false
    }

    Object.defineProperty(func, 'name', {
      value: name,
      writable: false,
      ...commonPropertyProps
    })

    Object.defineProperty(func, 'length', {
      ...commonPropertyProps,
      get() {
        const executor = getExecutor()

        if (!isFunction(executor)) {
          return -1
        }

        return executor.length
      }
    })

    func.getExecutor = getExecutor
    func.isExecutable = function(...args) {
      return isFunction(getExecutor.apply(this, args))
    }

    return func
  }
}
