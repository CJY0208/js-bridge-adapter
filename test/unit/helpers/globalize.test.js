const { expect } = require('chai')
const { globalize } = require('../../../index')

describe('单元测试 / helpers / globalize', () => {
  let localFunc = (a, b) => a + b

  // 转换为全局函数后默认执行后不会自动销毁
  let globalFuncName = globalize(localFunc)
  it('默认使用方式，转换为全局函数后默认执行后不会自动销毁', () => {
    expect(
      global[globalFuncName](1, 2) // 3
    ).to.be.equal(3)
    expect(
      globalFuncName in global // true
    ).to.be.equal(true)
  })

  // 自定义转为全局函数后的函数名
  let customizedGlobalFuncName = globalize(localFunc, {
    name: 'test'
  })
  it('自定义转为全局函数后的函数名', () => {
    expect(
      customizedGlobalFuncName === 'test' // true
    ).to.be.equal(true)
    expect(
      global.test(1, 2) // 3
    ).to.be.equal(3)
  })

  // 声明全局函数仅执行一次后自动销毁
  let globalFuncName2 = globalize(localFunc, {
    once: true
  })
  it('可声明全局函数仅执行一次后自动销毁', () => {
    expect(
      global[globalFuncName2](1, 2) // 3
    ).to.be.equal(3)
    expect(
      globalFuncName2 in global // false
    ).to.be.equal(false)
  })
})
