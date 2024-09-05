## CHCLI

一个脚手架

## 安装

```js
npm install -g chuncli
```

## 使用

项目提供了 **create**、 **start**、 **build** 三个命令

### create 创建一个项目

```js
chcli create [options] <templateName> <projectName>
```

- templateName: vue | react
- projectName: 创建的项目名称
- options: -f | --force 当前目录存在同名文件夹时覆盖

### start 启动项目

```js
chcli create [options]
```

#### options 可选项:

1.  -D | --debug  
    开启 debug 模式，可以看到更多打印信息
2.  -C | --config <配置文件路径>
    - 指定配置文件，不传入会查找项目内 **chun.config.(js|json|mjs)**
    - 当存在多个优先级**js>json>mjs**
    - 会对该配置文件监听，当有修改时会自动重启项目
3.  -P | --port <端口号>  
    指定端口号，默认使用**8080**，当端口不可用会使用新的可用端口
4.  -T | --type <启动项目类型>  
    可传入**vue|react**，不传默认为 **vue**

#### 关于配置文件

```js
module.exports = {
  defineConfig: {...},
  hooks: [...],
  plugins: [...]
}
```

- defineConfig: webpack 相关配置  
  格式同 webpack 配置
- hooks: chcli 钩子

```js
module.exports = {
  hooks: [
    ['registed', function (context) {}], // [触发阶段, 回调函数]
    ['registed', '../xx/xx.js'], // [触发阶段, 要执行的 js 文件路径]
    ['registed', 'saaa.js'], // [触发阶段, 要执行的 node_modules 中文件]
    ['xx', 'xx'] // 自定义hook，可以配合插件使用
  ]
}
// 触发阶段可选
// 1. registed: 解析完hooks后立即执行
// 2. unStarted: 启动之前
// 3. started: 启动完成后
```

- plugin: chcli 插件

```js
module.exports = {
  plugins: [
    'pluginName', // node_modules 中插件
    './pluginName', // 项目内插件
    function () {} // 直接写回调
  ]
}
```

如果要传参数

```js
module.exports = {
  plugins: [['pluginName', { a: 1 }]]
}
```

插件默认参数

```js
module.exports = {
  plugins: [['./testPligin.js', { a: 1 }]]
}

// testPligin.js
module.exports = function (API, params) {
  console.log(params) // { a: 1 }
  const { getWebpackConfig, getVal, setVal, emitHooks } = API
  // getWebpackConfig: ()=> WebpackChain, 返回一个WebpackChain的实例，可以链式修改webpack配置
  // getVal: (key:string)=> any 获取之前插件设置的内容
  // setVal: (key:string, value: any)=> void 设置一个属性，后续插件可以使用
  // emitHooks: (key: string)=> void 手动触发一类hook，可以配合自定义hook使用
}
```

插件会在执行完 registed hook 后依次执行

#### 最终传入 webpack 的配置文件

项目内置了 vue 和 react 的一些基础配置，同时可以从配置文件传入和插件传入，最终执行时会进行合并

```js
merge(当前启动类型的基础配置, 配置文件中传入的配置, 插件修改的配置)
// 后面覆盖前面
```

### build 项目打包

```js
chcli build [options]
```

#### options 可选项:

1.  -C | --config <配置文件路径>
    - 指定配置文件，不传入会查找项目内 **chun.config.(js|json|mjs)**
    - 当存在多个优先级**js>json>mjs**
    - 会对该配置文件监听，当有修改时会自动重启项目
2.  -T | --type <启动项目类型>  
    可传入**vue|react**，不传默认为 **vue**

配置文件最终执行情况同 start
