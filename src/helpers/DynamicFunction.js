const isFunction = value => typeof value === 'function'
const isPromise = value => !!value && isFunction(value.then)
const parseConfig = (p1, p2) => {
  switch (typeof p1) {
    case 'string':
      return {
        name: p1,
        getExecutor: p2
      }
    case 'function':
      return {
        getExecutor: p1
      }
    case 'object':
    default:
      return p1
  }
}
export const gen = (getExecutor, valuer) =>
  function(...args) {
    let executor = getExecutor.apply(this, args)

    return isPromise(executor)
      ? new Promise(resolve =>
          executor.then(executor =>
            resolve(valuer.call(this, executor, ...args))
          )
        )
      : valuer.call(this, executor, ...args)
  }

export default class DynamicFunction {
  constructor(...config) {
    const { name = '', getExecutor } = parseConfig(...config)

    const func = gen(getExecutor, function(executor, ...args) {
      return isFunction(executor) ? executor.apply(this, args) : undefined
    })

    func.getExecutor = getExecutor
    func.isExecutable = gen(getExecutor, executor => isFunction(executor))
    func.getName = gen(getExecutor, executor =>
      name ? name : isFunction(executor) ? executor.name : ''
    )
    func.getLength = gen(getExecutor, executor =>
      isFunction(executor) ? executor.length : undefined
    )

    return func
  }
}
