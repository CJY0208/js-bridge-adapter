import { get } from '../helpers/try'
import { isFunction } from '../helpers/is'
import DynamicFunction, { gen } from '../helpers/DynamicFunction'

const parseConfig = config => {
  if (typeof config === 'function') {
    return {
      runner: config
    }
  }

  return config
}

export default class Api {
  static default = {
    isSupported: () => true,
    runner: undefined
  }

  constructor(config = {}) {
    const {
      runner = Api.default.runner,
      name = get(runner, 'name'),
      isSupported = Api.default.isSupported,
      getRunner: getExecutor = gen(isSupported, isSupported =>
        isSupported && isFunction(runner) ? runner : undefined
      )
    } = parseConfig(config)

    const func = new DynamicFunction({ name, getExecutor })

    func.isSupported = func.isExecutable
    func.getRunner = func.getExecutor

    delete func.isExecutable
    delete func.getExecutor

    return func
  }
}
