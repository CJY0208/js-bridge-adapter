import { run } from '../helpers/try'
import { isFunction } from '../helpers/is'
import globalize from '../helpers/globalize'
import EventBus from '../helpers/eventBus'
import Api from './Api'

export default class Bridge {
  static Api = Api
  static globalize = globalize

  eventBus = new EventBus()
  isReady = false
  configured = false
  runAfterReady = false
  apis = {}

  constructor(name = 'anonymous') {
    this.name = name
  }

  onReady = listener => {
    this.eventBus.subscribe('ready', listener, true)
    if (this.isReady) {
      this.eventBus.notify('ready')
    }

    return this
  }

  ready = () => {
    if (this.isReady) {
      return console.error(`[Warning] Bridge "${this.name}" is ready`)
    }

    this.isReady = true
    this.eventBus.notify('ready')
  }

  config = ({ support, api: getRunner, runAfterReady = false } = {}) => {
    if (this.configured) {
      console.error(`[Warning] Bridge "${this.name}" has been configured`)
      return this
    }

    this.bridgeSupport = support
    this.getRunner = getRunner
    this.runAfterReady = runAfterReady
    this.configured = true

    return this
  }

  support = key => {
    const runner = this.get(key)
    const isSupported = run(runner, 'isSupported')

    return !!isSupported
  }

  api = (key, { runner = this.getRunner(key) } = {}) => {
    const bridgeRunner = new Api({
      name: key,
      runner,
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
        runner: getCustomizedRunner(runner)
      })

    return bridgeRunner
  }

  register = (apis = {}) => {
    Object.assign(this.apis, run(apis, undefined, this.api))
    return this
  }
  has = key => !!this.apis[key]
  get = key => this.apis[key]
  call = (key, ...args) => {
    if (!this.has(key)) {
      return console.warn(
        `[Unregistered] Api "${key}" is unregistered in Bridge "${this.name}"`
      )
    }

    const api = this.get(key)
    const exec = () => {
      const runner = run(api, `getRunner`)

      if (!isFunction(runner)) {
        return console.warn(
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
      return console.warn(
        `[Not Ready] Bridge "${
          this.name
        }" is not ready, can't call Api "${key}"`
      )
    }
  }
}
