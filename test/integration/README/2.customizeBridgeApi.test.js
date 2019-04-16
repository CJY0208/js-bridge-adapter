const { expect } = require('chai')
const { default: Bridge, Api } = require('../../../index')

Bridge.default.silent = true

describe('集成测试 / README / 定制交互的执行方式', () => {
  let AndroidBridge = {
    androidTest(param1, param2) {
      return [param1, param2].join(', ')
    }
  }

  const bridge = new Bridge('android')

  bridge.config({
    support: key => key in AndroidBridge,
    api: key => (...args) => AndroidBridge[key](...args)
  })

  bridge.register({
    test: bridge.api('androidTest'), // 不做处理
    test1: bridge
      .api('androidTest') // 执行前先处理参数
      .customize(runner => (param1, param2) => runner(param1 + 1, param2 + 1)),

    test2: bridge
      .api('androidTest') // 参数位置对调
      .customize(runner => (param1, param2) => runner(param2, param1)),

    test3: bridge
      .api('androidTest') // 可定制多次，注意：由下到上执行
      .customize(runner => (param1, param2) => runner(param1 + 1, param2 + 1))
      .customize(runner => (param1, param2) => runner(param1 * 2, param2 * 2)),

    test4: bridge
      .api('androidTest') // 可定制多次，注意：由下到上执行
      .customize(runner => (param1, param2) => runner(param1 * 2, param2 * 2))
      .customize(runner => (param1, param2) => runner(param1 + 1, param2 + 1))
  })

  
  it('未作定制的交互', () => {
    expect(bridge.call('test', 1, 2)).to.be.equal('1, 2')
  })
  it('执行前先处理参数的交互', () => {
    expect(bridge.call('test1', 1, 2)).to.be.equal('2, 3')
  })
  it('参数位置对调的交互', () => {
    expect(bridge.call('test2', 1, 2)).to.be.equal('2, 1')
  })
  it('多次定制的交互能正常执行', () => {
    expect(bridge.call('test3', 1, 2)).to.be.equal('3, 5')
  })
  it('反序多次定制的交互', () => {
    expect(bridge.call('test4', 1, 2)).to.be.equal('4, 6')
  })
})
