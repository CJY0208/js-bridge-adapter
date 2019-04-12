import { get, run } from './try'
import { isFunction } from './is'

export default class EventBus {
  __listeners = {}

  subscribe = (event, listener, once = false) => {
    if (!isFunction(listener)) {
      return console.error('[EventBus Error] listener is not a function')
    }

    this.__listeners[event] = [
      ...get(this.__listeners, event, []),
      Object.assign(listener, { once })
    ]
  }

  notify = (event, ...args) => {
    this.__listeners[event] = run(
      this.__listeners,
      `${event}.filter`,
      listener => {
        run(listener, undefined, ...args)
        return !listener.once
      }
    )
  }
}
