const { expect } = require('chai')
const { default: Bridge, Api } = require('../../../index')

Bridge.default.silent = true

describe('集成测试 / README / 基础示例', () => {
  // 假设 native 提供的 bridge 调用方式与 native 侧执行方式为以下等价代码
  let execTimes = 0 // 此变量用以检测交互是否被执行
  let AndroidBridge = {
    androidLogin(callback) {
      execTimes++
      setTimeout(() => {
        callback('login success')
      })
    }
  }

  const bridge = new Bridge('android')

  // 此处配置 bridge 对象如何对接 native 端，主要为以下两点
  // 1、如何做支持检测
  // 2、如何执行
  bridge.config({
    support: key => typeof AndroidBridge[key] !== 'undefined',
    api: key => (...args) => AndroidBridge[key](...args)
  })

  const login = bridge.api('androidLogin')

  bridge.register({ login })

  describe('bridge 未就绪时', () => {
    it('bridge.isReady 应为 false', () => {
      expect(bridge.isReady).to.be.equal(false)
    })
    it('login.isSupported() 应为 false', () => {
      expect(
        login.isSupported() // false
      ).to.be.equal(false)
    })
    it('login(...) 应不执行', () => {
      login(res => console.log(res)) // 调用无反应
      expect(execTimes).to.be.equal(0)
    })
    it("bridge.support('login') 应为 false", () => {
      expect(
        bridge.support('login') // false
      ).to.be.equal(false)
    })
    it("bridge.call('login', ...) 应不执行", () => {
      bridge.call('login', res => console.log(res)) // 调用无反应
      expect(execTimes).to.be.equal(0)
    })
  })

  describe('bridge 就绪后', () => {
    it('bridge.isReady 应为 true', () => {
      // 声明 bridge 已就绪，模拟 native 环境下 bridge 延时就绪的情况
      bridge.ready()
      expect(bridge.isReady).to.be.equal(true)
    })
    it('login.isSupported() 应为 true', () => {
      expect(
        login.isSupported() // true
      ).to.be.equal(true)
    })
    it('login(...) 可按预期执行', () => {
      login(res => {
        expect(res).to.be.equal('login success') // res === 'login success'
      })
      expect(execTimes).to.be.equal(1)
    })
    it("bridge.support('login') 应为 true", () => {
      expect(
        bridge.support('login') // true
      ).to.be.equal(true)
    })
    it("bridge.call('login', ...) 可按预期执行", () => {
      bridge.call('login', res => {
        expect(res).to.be.equal('login success') // res === 'login success'
      })
      expect(execTimes).to.be.equal(2)
    })
  })
})
