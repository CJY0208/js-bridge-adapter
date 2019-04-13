const { expect } = require('chai')
const compareVerions = require('compare-versions')
const { default: Bridge, Api } = require('../../../index')

Bridge.default.silent = true

describe('集成测试 / README / 交互的版本控制', () => {
  describe('仅控制接口的支持性，不改变接口的行为', () => {
    // 此处假设原生版本号
    let version = '1.0.1'
    let runnerTimes = 0

    // 该交互仅在版本 1.2.0 及其以上生效
    const test = new Api({
      isSupported: () => compareVerions(version, '1.2.0') > -1,
      runner: (a, b) => {
        runnerTimes++
        return a + b
      }
    })

    describe('版本条件不满足时', () => {
      it('api.isSupported() 应为 false', () => {
        expect(
          test.isSupported() // false
        ).to.be.equal(false)
      })
      it('api() 不执行', () => {
        expect(test(1, 2)).to.be.equal(undefined)
        expect(runnerTimes).to.be.equal(0)
      })
    })

    describe('版本条件满足时', () => {
      it('api.isSupported() 应为 true', () => {
        version = '1.2.1'
        expect(
          test.isSupported() // true
        ).to.be.equal(true)
      })
      it('api() 正常执行', () => {
        expect(test(1, 2)).to.be.equal(3)
        expect(runnerTimes).to.be.equal(1)
      })
    })
  })

  describe('完全的版本控制', () => {
    let AndroidBridge = {
      androidTest(param1, param2) {
        return [param1, param2].join(', ')
      }
    }
    const bridge = new Bridge('android').config({
      support: key => key in AndroidBridge,
      api: key => (...args) => AndroidBridge[key](...args)
    })

    let version = '1.0.1'
    // 假设 bridge 未就绪

    bridge.register({
      test: new Api({
        getRunner() {
          // bridge 未就绪时不支持
          if (!bridge.isReady) {
            return null
          }

          // 当版本大于等于 1.2.0 且小于 1.3.0 时支持交互
          if (
            compareVerions(version, '1.2.0') > -1 &&
            compareVerions(version, '1.3.0') === -1
          ) {
            const test = bridge.api('androidTest')
            // 假设 1.2.6 时接口参数被错误反转，需要做行为修正
            if (compareVerions(version, '1.2.6') === 0) {
              return test.customize(runner => (p1, p2) => runner(p2, p1))
            }

            return test
          }

          return null
        }
      })
    })

    it('可按预期执行', () => {
      expect(
        bridge.support('test') // false，因为 bridge 未就绪
      ).to.be.equal(false)

      bridge.ready()
      expect(
        bridge.support('test') // false 因为版本号条件未满足
      ).to.be.equal(false)

      version = '1.2.0'
      expect(
        bridge.support('test') // true
      ).to.be.equal(true)
      expect(
        bridge.call('test', 1, 2) // log '1, 2'
      ).to.be.equal('1, 2')

      version = '1.2.6'
      expect(
        bridge.call('test', 1, 2) // log '2, 1'
      ).to.be.equal('2, 1')

      version = '1.3.3'
      expect(
        bridge.support('test') // false 因为版本号条件未满足
      ).to.be.equal(false)
    })
  })
})
