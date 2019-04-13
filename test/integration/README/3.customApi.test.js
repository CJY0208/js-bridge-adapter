const { expect } = require('chai')
const { default: Bridge, Api } = require('../../../index')

Bridge.default.silent = true

describe('集成测试 / README / 自定义交互', () => {
  describe('基本使用方式', () => {
    const bridge = new Bridge()

    const test = new Api((a, b) => a + b)

    it('api.isSupported 支持性检测正常', () => {
      expect(test.isSupported()).to.be.equal(true)
    })
    it('api() 可正常执行', () => {
      expect(test(1, 2)).to.be.equal(3)
    })

    bridge.register({ test })
    // 此处假设 bridge 仍未就绪
    // 使用 Api 生成的自定义交互不受 bridge.isReady 状态的影响

    it('bridge.support 支持性检测正常，不受 bridge.isReady 影响', () => {
      expect(bridge.isReady).to.be.equal(false)
      expect(bridge.support('test')).to.be.equal(true)
    })
    it('bridge.call 可正常执行，不受 bridge.isReady 影响', () => {
      expect(bridge.isReady).to.be.equal(false)
      expect(bridge.call('test', 1, 2)).to.be.equal(3)
    })
  })

  describe('设置 isSupported 支持检测器', () => {
    const bridge = new Bridge()

    const test = new Api({
      isSupported: () => bridge.isReady,
      runner: (a, b) => a + b
    })

    bridge.register({ test })

    describe('isSupported 条件未满足时', () => {
      it('api.isSupported() 应为 false', () => {
        expect(test.isSupported()).to.be.equal(false)
      })
      it('api() 应不执行', () => {
        expect(test(1, 2)).to.be.equal(undefined)
      })
      it("bridge.support('api') 应为 false", () => {
        expect(bridge.support('test')).to.be.equal(false)
      })
      it("bridge.call('api') 应不执行", () => {
        expect(bridge.call('test', 1, 2)).to.be.equal(undefined)
      })
    })
    describe('isSupported 条件满足时', () => {
      it('api.isSupported() 应为 true', () => {
        bridge.ready()
        expect(test.isSupported()).to.be.equal(true)
      })
      it('api() 应正常执行', () => {
        expect(test(1, 2)).to.be.equal(3)
      })
      it("bridge.support('api') 应为 true", () => {
        expect(bridge.support('test')).to.be.equal(true)
      })
      it("bridge.call('api') 应正常执行", () => {
        expect(bridge.call('test', 1, 2)).to.be.equal(3)
      })
    })
    describe('如果配置时只提供了 isSupported，而 runner 为非函数', () => {
      const test2 = new Api({
        isSupported: () => true
      })
      bridge.register({ test2 })
      it('api.isSupported() 为 false', () => {
        expect(
          test2.isSupported() // false
        ).to.be.equal(false)
      })
      it("bridge.support('api') 为 false", () => {
        expect(
          bridge.support('test2') // false
        ).to.be.equal(false)
      })
    })
  })

  describe('调整 Api 的默认配置', () => {
    it('调整默认配置后按预期执行', () => {
      const bridge = new Bridge()

      const orinalDefaultConfig = Object.assign({}, Api.default)

      Api.default.isSupported = () => bridge.isReady
      Api.default.runner = () => '你可能忘了提供执行体'

      const test = new Api()
      expect(test.isSupported()).to.be.equal(false) // false

      bridge.ready()
      expect(test()).to.be.equal('你可能忘了提供执行体') // warn '你可能忘了提供执行体'

      // 恢复 Api.default 以保证后续测试行为正常
      Api.default = orinalDefaultConfig
      bridge.isReady = false

      const test2 = new Api(() => 'yeah')
      expect(test2.isSupported()).to.be.equal(true) // true
      expect(test2()).to.be.equal('yeah')
    })
  })

  describe('Api 的动态函数模式', () => {
    const bridge = new Bridge()

    let getRunnerTimes = 0
    let runnerTimes = 0
    const test = new Api({
      getRunner() {
        getRunnerTimes++
        if (!bridge.isReady) {
          return null
        }

        return (a, b) => {
          runnerTimes++
          return a + b
        }
      }
    })

    describe('getRunner 返回非函数时', () => {
      it('api.isSupported() 应为 false', () => {
        expect(test.isSupported()).to.be.equal(false)
        expect(getRunnerTimes).to.be.equal(1)
        expect(runnerTimes).to.be.equal(0)
      })
      it('api() 无法执行', () => {
        expect(test(1, 2)).to.be.equal(undefined)
        expect(getRunnerTimes).to.be.equal(2)
        expect(runnerTimes).to.be.equal(0)
      })
    })

    describe('getRunner 返回函数时', () => {
      it('api.isSupported() 应为 true', () => {
        bridge.ready()
        expect(test.isSupported()).to.be.equal(true)
        expect(getRunnerTimes).to.be.equal(3)
        expect(runnerTimes).to.be.equal(0)
      })
      it('api() 能按预期运行', () => {
        expect(test(1, 2)).to.be.equal(3)
        expect(getRunnerTimes).to.be.equal(4)
        expect(runnerTimes).to.be.equal(1)
      })
    })
  })
})
