# JsBridgeAdapter

`web` 端 `bridge` 适配器，适用于对接任意 `native` 端 `bridge` 方案

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
import Bridge from 'jsbridge-adapter'

const bridge = new Bridge('android')

// 此处配置 bridge 对象如何对接 native 端，主要为以下两点
// 1、如何做支持检测
// 2、如何执行
bridge.config({
  support: key => typeof window.AndroidBridge[key] !== 'undefined',
  api: key => (...args) => window.AndroidBridge[key](...args)
})

bridge.register({
  login: bridge.api('androidLogin')
})

// bridge 未就绪时
bridge.support('login') // false
bridge.call('login', res => console.log(res)) // 调用无反应

// 声明 bridge 已就绪，模拟 native 环境下 bridge 延时就绪的情况
bridge.ready()

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
// 假设 bridge 未就绪

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

bridge.ready() // 不要忘记这一句
bridge.call('test', 1, 2) // log '1, 2'
bridge.call('test1', 1, 2) // log '2, 3'
bridge.call('test2', 1, 2) // log '2, 1'
bridge.call('test3', 1, 2) // log '3, 5' 由下到上执行，所以并不是 '4, 6'
```

- - -

## <div id="dynamicfunction"/> 动态函数

在实现 **自定义交互** 及对 **版本控制** 之前，需要先了解该适配器中 **动态函数** 的概念

动态函数是一种特殊的函数，在函数执行前，需要先获取函数执行体，如果获得的执行体为非函数，则动态函数将不执行

同时，动态函数拥有一个方法 `isExecutable` 用以检测动态函数是否可以被执行

动态函数的粗略实现如下

```javascript
const isFunction = value => typeof value === 'function'

function DynamicFunction(getExecutor) {
  
  const func = (...args) => {
    const executor = getExecutor(...args)

    if (!isFunction(executor)) {
      return
    }

    return executor(...args)
  }

  func.isExecutable = (...args) => isFunction(getExecutor(...args))

  return func
}
```

```javascript
let flag = false

const dynamicFunc = new DynamicFunction(() => {
  if (!flag) {
    return null
  }

  return (a, b) => a + b
})

dynamicFunc.isExecutable() // false
dynamicFunc(1, 2) // 无反应

flag = true
dynamicFunc.isExecutable() // true
dynamicFunc(1, 2) // 3

flag = false
dynamicFunc.isExecutable() // false
dynamicFunc(1, 2) // 无反应
```

接下来，我们借助动态函数的特性，来实现自定义交互及对交互进行版本控制

- - -

## <div id="customize" /> 自定义交互

`Api` 是一个封装过后的动态函数，它具有更直观的参数名称

**注意：使用 `Api` 生成的自定义交互不受 `bridge.isReady` 状态的影响**

基本使用方式如下

```javascript
...
import { Api } from 'jsbridge-adapter'
...

const test = new Api((a, b) => a + b)

test.isSupported() // true
test(1, 2) // 3

bridge.register({ test })
// 此处假设 bridge 仍未就绪
// 使用 Api 生成的自定义交互不受 bridge.isReady 状态的影响
bridge.support('test') // true
bridge.call('test', 1, 2) // 3
```

自定义交互也可以设置 `isSupported` 支持检测器

```javascript
...
import { Api } from 'jsbridge-adapter'
...
// 假设 bridge 未就绪

const test = new Api({
  isSupported: () => bridge.isReady,
  runner: (a, b) => a + b
})

bridge.register({ test })

test.isSupported() // false
test(1, 2) // 无反应
bridge.support('test') // false
bridge.call('test', 1, 2) // 无反应

bridge.ready()
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

Api.default.isSupported = () => bridge.isReady
Api.default.runner = () => console.warn('你可能忘了提供执行体')

const test = new Api()
test.isSupported() // false

bridge.ready()
test() // warn '你可能忘了提供执行体'
```

### <div id="apidynamicfunctionmode"/> `Api` 的动态函数模式

使用 `getRunner` 配置以启用动态函数模式

重温[动态函数](#dynamicfunction)的定义：在执行前，需先获取函数执行体，如果获得的执行体为非函数，则动态函数将不执行

**注意：当使用动态函数模式时，`isSupported` 和 `runner` 将不生效**

```javascript
...
// 假设 bridge 尚未就绪

const test = new Api({
  getRunner() {
    if (!bridge.isReady) {
      return null
    }

    return (a, b) => a + b
  }
})

test.isSupported() // false
test(1, 2) // 没反应

bridge.ready()
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
import { Api } from 'jsbridge-adapter'
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

接下来，在了解了[动态函数](#dynamicfunction)、以及 `Api` 的[动态函数模式](#apidynamicfunctionmode)后，我们可以实现完全的版本控制

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

bridge.support('test') // false，因为 bridge 未就绪

bridge.ready()
bridge.support('test') // false 因为版本号条件未满足

version = '1.2.0'
bridge.support('test') // true
bridge.call('test', 1, 2) // log '1 2'

version = '1.2.6'
bridge.call('test', 1, 2) // log '2 1

version = '1.3.3'
bridge.support('test') // false 因为版本号条件未满足
```
