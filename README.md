# JsBridgeAdapter

`web` 端 `bridge` 适配器，适用于对接任意 `native` 端 `bridge` 方案

基于[动态函数](https://github.com/CJY0208/js-dynamic-function)制作

- - -

## 目的

市面上的 `jsBridge` 方案大多为 `native` 端方案，缺乏 `web` 端对接 `native` 的方案

此处基于对 `jsBridge` 调用、注册要求的理解，制作了此适配器

适用于对接任意 `native` 端 `bridge` 方案，并具有以下特点

1. 交互的支持检测
2. [交互的执行定制](#customizebridgeapi)
3. [自定义交互](#customize)
4. [交互的版本控制](#versioncontrol)

- - -

## 示例

假设 `native` 提供的 `bridge` 调用方式与 `native` 侧执行方式为以下等价代码

```javascript
window.AndroidBridge = {
  androidLogin(callback) {
    setTimeout(() => {
      callback('login success')
    })
  }
}
```

使用适配器的对接代码如下

```javascript
import Bridge from 'js-bridge-adapter'

const bridge = new Bridge('android')

// 模拟 native 环境下 bridge 延时就绪的情况
let isReady = false

// 此处配置 bridge 对象如何对接 native 端，主要为以下两点
// 1、如何做支持检测
// 2、如何执行
bridge.config({
  support: key => isReady && key in window.AndroidBridge,
  api: key => (...args) => window.AndroidBridge[key](...args)
})

bridge.register({
  login: bridge.api('androidLogin')
})

// bridge 未就绪时
bridge.support('login') // false
bridge.call('login', res => console.log(res)) // 调用无反应

// bridge 就绪后
isReady = true
bridge.support('login') // true
bridge.call('login', res => console.log(res)) // log 'login success'
```

- - -

## <div id="customizebridgeapi" /> 定制交互的执行方式

假设 `native` 提供的交互如下，由于某种原因，我们期望在 **调用前对参数进行处理，或者参数位置对调** 等

使用 `customize` 来定制 `bridge` 交互以完成上述需求

```javascript
window.AndroidBridge = {
  androidTest(param1, param2) {
    console.log(param1, param2)
  }
}
```
```javascript
...

bridge.register({
  test: bridge.api('androidTest'), // 不做处理
  test1: bridge.api('androidTest') // 执行前先处理参数
    .customize(runner => 
      (param1, param2) => 
        runner(param1 + 1, param2 + 1)
    ),

  test2: bridge.api('androidTest') // 参数位置对调
    .customize(runner => 
      (param1, param2) => runner(param2, param1)
    ),
  
  test3: bridge.api('androidTest') // 可定制多次，注意：由下到上执行
    .customize(runner => 
      (param1, param2) => 
        runner(param1 + 1, param2 + 1)
    )
    .customize(runner => 
      (param1, param2) => 
        runner(param1 * 2, param2 * 2)
    )
})

bridge.call('test', 1, 2) // log '1, 2'
bridge.call('test1', 1, 2) // log '2, 3'
bridge.call('test2', 1, 2) // log '2, 1'
bridge.call('test3', 1, 2) // log '3, 5' 由下到上执行，所以并不是 '4, 6'
```

- - -

## <div id="customize" /> 自定义交互

`Api` 是一个简易优化过后的[动态函数](https://github.com/CJY0208/js-dynamic-function)，它具有比[动态函数](https://github.com/CJY0208/js-dynamic-function)更直观的参数名称和声明方式如 `isSupported` 和 `runner` 配置项

**注意：使用 `Api` 生成的自定义交互不受 `bridge.config.support` 的影响**

基本使用方式如下

```javascript
...
import { Api } from 'js-bridge-adapter'
...

const test = new Api((a, b) => a + b)

test.isSupported() // true
test(1, 2) // 3

bridge.register({ test })

bridge.support('test') // true
bridge.call('test', 1, 2) // 3
```

自定义交互也可以设置 `isSupported` 支持检测器

```javascript
...
import { Api } from 'js-bridge-adapter'
...
let isReady = false

const test = new Api({
  isSupported: () => isReady,
  runner: (a, b) => a + b
})

bridge.register({ test })

test.isSupported() // false
test(1, 2) // 无反应
bridge.support('test') // false
bridge.call('test', 1, 2) // 无反应

isReady = true
test.isSupported() // true
test(1, 2) // 3
bridge.support('test') // true
bridge.call('test', 1, 2) // 3
```

如果配置时只提供了 `isSupported`，而 `runner` 为非函数，那么 `isSupported` 执行结果依然会为 `false`

```javascript
...
const test = new Api({
  isSupported: () => true
})
bridge.register({ test })
test.isSupported() // false
bridge.support('test') // false
```

### 调整 Api 的默认配置

```javascript
...
// 假设 bridge 尚未就绪

let isReady = false

Api.default.isSupported = () => isReady
Api.default.runner = () => console.warn('你可能忘了提供执行体')

const test = new Api()
test.isSupported() // false

isReady = true
test() // warn '你可能忘了提供执行体'
```

### <div id="apidynamicfunctionmode"/> `Api` 的[动态函数](https://github.com/CJY0208/js-dynamic-function)模式

使用 `getRunner` 配置以启用[动态函数](https://github.com/CJY0208/js-dynamic-function)模式

**注意：当使用[动态函数](https://github.com/CJY0208/js-dynamic-function)模式时，`isSupported` 和 `runner` 将不生效**

```javascript
...
let isReady = false

const test = new Api({
  getRunner() {
    if (!isReady) {
      return null
    }

    return (a, b) => a + b
  }
})

test.isSupported() // false
test(1, 2) // 没反应

isReady = true
test.isSupported() // true
test(1, 2) // 3
```

- - -

## <div id="versioncontrol" /> 交互的版本控制

以下使用 [compare-versions](https://github.com/omichelsen/compare-versions) 来做演示

首先，我们仅控制接口的支持性，不改变接口的行为

```javascript
...
import compareVerions from 'compare-versions'
import { Api } from 'js-bridge-adapter'
...

// 此处假设原生版本号
let version = '1.0.1'

// 该交互仅在版本 1.2.0 及其以上生效
const test = new Api({
  isSupported: () => compareVerions(version, '1.2.0') > -1,
  runner: bridge.api('androidTest')
})

test.isSupported() // false
version = '1.2.1'
test.isSupported() // true
```

接下来，在了解了[动态函数](https://github.com/CJY0208/js-dynamic-function)、以及 `Api` 的[动态函数模式](#apidynamicfunctionmode)后，我们可以实现完全的版本控制

```javascript
window.AndroidBridge = {
  androidTest(param1, param2) {
    console.log(param1, param2)
  }
}
```
```javascript
...
let version = '1.0.1'
let isReady = false

bridge.register({
  test: new Api({
    getRunner() {
      
      // bridge 未就绪时不支持
      if (!isReady) {
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

bridge.support('test') // false，因为 bridge 未就绪

isReady = true
bridge.support('test') // false 因为版本号条件未满足

version = '1.2.0'
bridge.support('test') // true
bridge.call('test', 1, 2) // log '1 2'

version = '1.2.6'
bridge.call('test', 1, 2) // log '2 1

version = '1.3.3'
bridge.support('test') // false 因为版本号条件未满足
```

- - -

## 异步检测

当 `bridge.config.support` 为异步函数时，`bridge.support/call` 方法均为异步

```javascript
...

const delay = time => new Promise(resolve => setTimeout(resolve, time))

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

await bridge.support('test') // log 'true' after 1000ms
await test.isSupported() // log 'true' after 1000ms

await bridge.call('test') // log 'Test Log' after 1000ms
await test() // log 'Test Log' after 1000ms
```

同时，`Api` 与 `DynamicFunction` 函数享有类似的异步功能

```javascript
...

const delay = time => new Promise(resolve => setTimeout(resolve, time))

const test = new Api({
  getRunner: async () => {
    await delay(1000)

    return (a, b) => a + b
  }
})

await test.isSupported() // log 'true' after 1000ms
await test(1, 2) // log '3' after 1000ms
```

- - -

## 其他功能

### **`bridge.has(apiName)`**

检测 `bridge` 中交互是否已注册

```javascript
...
bridge.register({
  test: bridge.api('androidTest')
})
bridge.has('test') // true
bridge.has('test2') // false
...
```

### **`bridge.get(apiName)`**

获取 `bridge` 中已注册交互的执行体

```javascript
...
bridge.register({
  test: new Api((a, b) => a + b)
})

const test = bridge.get('test')

test.isSupported() // true
test(1, 2) // 3
```

### **`uniqueId([prefix = ''])`**

生成一个随机的、唯一的 id 值

```javascript
import { uniqueId } from 'js-bridge-adapter'
```

生成规则如下


```javascript
let uuid = 0

const uniqueId = (prefix = '') =>
  `${prefix}_${++uuid}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
```


### **`globalize(localFunc[, config])`**

将局部函数转为全局函数，执行后得到生成的全局函数名，默认全局函数名通过 `uniqueId()` 生成

```javascript
import { globalize } from 'js-bridge-adapter'    

let localFunc = (a, b) => a + b

// 转换为全局函数后默认执行后不会自动销毁
let globalFuncName = globalize(localFunc)
window[globalFuncName](1, 2) // 3
globalFuncName in window // true

// 自定义转为全局函数后的函数名
let customizedGlobalFuncName = globalize(localFunc, {
  name: 'test'
})
customizedGlobalFuncName === 'test' // true
window.test(1, 2) // 3

// 声明全局函数仅执行一次后自动销毁
let globalFuncName2 = globalize(localFunc, {
  once: true
})
window[globalFuncName2](1, 2) // 3
globalFuncName2 in window // false
```
