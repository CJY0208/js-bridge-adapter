import { gen } from 'js-dynamic-function'

import { get, run } from '../helpers/try'
import { isFunction } from '../helpers/is'
import Api from './Api'

export default class Bridge {
  static Api = Api
  static default = {
    silent: false
  }

  constructor(name = 'anonymous') {
    this.name = name
  }

  apis = {}
  silent = Bridge.default.silent
  bridgeSupport = () => false
  getRunner = () => () => undefined

  log = (level, ...args) => {
    if (this.silent) {
      return
    }

    run(console, level, ...args)
  }

  config = ({ support, api, ...rest } = {}) =>
    Object.assign(this, rest, {
      getRunner: api,
      bridgeSupport: support
    })

  register = (apis = {}) => {
    Object.assign(this.apis, run(apis, undefined, this.api))
    return this
  }

  api = (key, { getRunner = () => this.getRunner(key) } = {}) => {
    const bridgeRunner = new Api({
      name: key,
      runner: (...args) => run(getRunner(), undefined, ...args),
      isSupported: () => this.bridgeSupport(key)
    })

    bridgeRunner.customize = getCustomizedRunner =>
      this.api(key, {
        getRunner: () => getCustomizedRunner(getRunner())
      })

    return bridgeRunner
  }

  support = key => this.has(key) && run(this.apis, `${key}.isSupported`)
  has = key => key in this.apis
  get = key => get(this.apis, key)
  call = (key, ...args) => {
    const unregisteredTips = `[Unregistered] Api "${key}" is unregistered in Bridge "${
      this.name
    }"`
    const notSupportedTips = `[Not Supported] Api "${key}" is not supported by Bridge "${
      this.name
    }"`

    if (!this.has(key)) {
      return this.log('warn', unregisteredTips)
    }

    return gen(
      () => run(this.apis, `${key}.getRunner`),
      runner => {
        if (!isFunction(runner)) {
          return this.log('warn', notSupportedTips)
        }

        return runner(...args)
      }
    )()
  }
}
