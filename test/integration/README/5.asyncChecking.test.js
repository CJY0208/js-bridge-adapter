const { expect } = require('chai')
const { default: Bridge, Api } = require('../../../index')

Bridge.default.silent = true

describe('集成测试 / README / 异步检测', () => {
  const delay = time => new Promise(resolve => setTimeout(resolve, time))

  it('当 bridge.config.support 为异步函数时，bridge.support/call 方法均为异步', async () => {
    const TestBridge = {
      test() {
        return 'Test Log'
      }
    }

    const bridge = new Bridge()

    bridge.config({
      support: async api => {
        await delay(1000)
        return api in TestBridge
      },
      api: key => (...args) => TestBridge[key](...args)
    })

    const test = bridge.api('test')

    bridge.register({ test })

    expect(
      JSON.stringify(
        await Promise.all([
          bridge.support('test'), // log 'true' after 1000ms
          test.isSupported(), // log 'true' after 1000ms
          bridge.call('test'), // log 'Test Log' after 1000ms
          test() // log 'Test Log' after 1000ms
        ])
      )
    ).to.be.equal(JSON.stringify([true, true, 'Test Log', 'Test Log']))
  })

  it('Api 与 DynamicFunction 函数享有类似的异步功能', async () => {
    const test = new Api({
      getRunner: async () => {
        await delay(1000)

        return (a, b) => a + b
      }
    })

    expect(
      JSON.stringify(
        await Promise.all([
          test.isSupported(), // log 'true' after 1000ms
          test(1, 2) // log '3' after 1000ms
        ])
      )
    ).to.be.equal(JSON.stringify([true, 3]))
  })
})
