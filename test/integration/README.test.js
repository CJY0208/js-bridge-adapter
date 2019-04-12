const { expect } = require('chai')
const { default: Bridge, Api } = require('../../index')

describe('README 示例集成测试', () => {
  describe('基础示例', () => {
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

  describe('定制交互的执行方式', () => {
    let AndroidBridge = {
      androidTest(param1, param2) {
        return [param1, param2].join(', ')
      }
    }

    const bridge = new Bridge('android')

    bridge.config({
      support: key => typeof AndroidBridge[key] !== 'undefined',
      api: key => (...args) => AndroidBridge[key](...args)
    })

    bridge.register({
      test: bridge.api('androidTest'), // 不做处理
      test1: bridge
        .api('androidTest') // 执行前先处理参数
        .customize(runner => (param1, param2) =>
          runner(param1 + 1, param2 + 1)
        ),

      test2: bridge
        .api('androidTest') // 参数位置对调
        .customize(runner => (param1, param2) => runner(param2, param1)),

      test3: bridge
        .api('androidTest') // 可定制多次，注意：由下到上执行
        .customize(runner => (param1, param2) => runner(param1 + 1, param2 + 1))
        .customize(runner => (param1, param2) =>
          runner(param1 * 2, param2 * 2)
        ),

      test4: bridge
        .api('androidTest') // 可定制多次，注意：由下到上执行
        .customize(runner => (param1, param2) => runner(param1 * 2, param2 * 2))
        .customize(runner => (param1, param2) => runner(param1 + 1, param2 + 1))
    })

    bridge.ready() // 不要忘记这一句
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

  describe('自定义交互', () => {
    
    describe('基本使用方式', () => {
      const bridge = new Bridge()

      const test = new Api((a, b) => a + b)

      it('isSupported 支持性检测正常', () => {        
        expect(test.isSupported()).to.be.equal(true)
      })
      it('函数本身可正常执行', () => {        
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

    // describe('设置 isSupported 支持检测器', () => {
    //   const bridge = new Bridge()

    //   const test = new Api({
    //     isSupported: () => bridge.isReady,
    //     runner: (a, b) => a + b
    //   })

    //   bridge.register({ test })

    //   it('isSupported 支持性检测正常', () => {        
    //     expect(test.isSupported()).to.be.equal(true)
    //   })
    //   it('函数本身可正常执行', () => {        
    //     expect(test(1, 2)).to.be.equal(3)
    //   })

    //   // 此处假设 bridge 仍未就绪
    //   // 使用 Api 生成的自定义交互不受 bridge.isReady 状态的影响

    //   it('bridge.support 支持性检测正常，不受 bridge.isReady 影响', () => {
    //     expect(bridge.isReady).to.be.equal(false)
    //     expect(bridge.support('test')).to.be.equal(true)
    //   })
    //   it('bridge.call 可正常执行，不受 bridge.isReady 影响', () => {
    //     expect(bridge.isReady).to.be.equal(false)
    //     expect(bridge.call('test', 1, 2)).to.be.equal(3)
    //   })
    // })
  })
})
