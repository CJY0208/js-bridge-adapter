import { get, run } from '../helpers/try'
import { isFunction } from '../helpers/is'
import EventBus from '../helpers/EventBus'
import Api from './Api'

export default class Bridge {
  static Api = Api
  static default = {
    runAfterReady: false,
    silent: false
  }

  eventBus = new EventBus()
  isReady = false
  apis = {}
  bridgeSupport = () => false
  getRunner = () => () => undefined
  runAfterReady = Bridge.default.runAfterReady
  silent = Bridge.default.silent

  constructor(name = 'anonymous') {
    this.name = name
  }

  log = (level, ...args) => {
    if (this.silent) {
      return
    }

    run(console, level, ...args)
  }

  onReady = listener => {
    this.eventBus.subscribe('ready', listener, true)
    if (this.isReady) {
      this.eventBus.notify('ready')
    }

    return this
  }

  ready = () => {
    this.isReady = true
    this.eventBus.notify('ready')

    return this
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

  support = key => {
    const runner = this.get(key)
    const isSupported = run(runner, 'isSupported')

    return !!isSupported
  }

  api = (key, { getRunner = this.getRunner } = {}) => {
    const bridgeRunner = new Api({
      name: key,
      runner: (...args) => run(getRunner(key), undefined, ...args),
      isSupported: () => {
        if (!this.isReady) {
          return false
        }
        return this.bridgeSupport(key)
      }
    })

    bridgeRunner.isFromBridge = true
    bridgeRunner.customize = getCustomizedRunner =>
      this.api(key, {
        getRunner: () => getCustomizedRunner(getRunner(key))
      })

    return bridgeRunner
  }

  has = key => key in this.apis
  get = key => get(this.apis, key)
  call = (key, ...args) => {
    if (!this.has(key)) {
      return this.log(
        'warn',
        `[Unregistered] Api "${key}" is unregistered in Bridge "${this.name}"`
      )
    }

    const api = this.get(key)
    const exec = () => {
      const runner = run(api, `getRunner`)

      if (!isFunction(runner)) {
        return this.log(
          'warn',
          `[Not Supported] Api "${key}" is not supported by Bridge "${
            this.name
          }`
        )
      }

      return runner(...args)
    }

    if (this.isReady || !api.isFromBridge) {
      return exec()
    }

    if (this.runAfterReady) {
      return new Promise(resolve => this.onReady(() => resolve(exec())))
    } else {
      return this.log(
        'warn',
        `[Not Ready] Bridge "${
          this.name
        }" is not ready, can't call Api "${key}"`
      )
    }
  }
}
