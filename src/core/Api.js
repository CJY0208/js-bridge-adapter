import { get } from '../helpers/try'
import { isFunction } from '../helpers/is'
import DynamicFunction from './DynamicFunction'

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
      isSupported = Api.default.isSupported,
      name = get(runner, 'name'),
      getRunner: getExecutor = () =>
        isFunction(runner) && isSupported() ? runner : false
    } = parseConfig(config)

    const func = new DynamicFunction({
      name,
      getExecutor
    })

    func.isSupported = func.isExecutable
    func.getRunner = func.getExecutor

    delete func.isExecutable
    delete func.getExecutor

    return func
  }
}
