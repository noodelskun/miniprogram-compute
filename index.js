/*
 * @Author: rkm
 * @Date: 2021-02-01 16:48:14
 * @LastEditTime: 2021-02-19 18:01:48
 * @FilePath: \miniprogram-compute\index.js
 * @LastEditors: rkm
 */
const oldPage = Page
Page = function (app) {
    let oldOnLoad = app.onLoad;
    app.onLoad = function (options) {
        // 存一下原来的setData
        let o_setData = this.setData
        // 用于保存依赖
        let dep = {}
        // 重写setData
        this.setData = function (o, fn) {
            // 调用原生setData
            o_setData.call(this, o, function () {
                // 如果定义有computed属性则判断一下是不是改变了计算属性中所依赖的变量
                if (app.computed) {
                    // 循环遍历
                    Object.keys(dep).map(c => {
                        Object.keys(o).map(i => {
                            // 找出需要触发更新的计算属性，兼容下几种写法
                            if (dep[c].includes(i) || dep[c].includes(i.split('.')[0]) || dep[c].includes(i.split('[')[0])) {
                                o_setData.call(this, {
                                    [c]: app.computed[c].call(this, this.data)
                                })
                            }
                        })
                    })
                }
                // 触发setData回调
                fn && fn.call(this)
            })
        }
        // 收集依赖，并将computed值挂载到data上
        if (app.computed) {
            // 为了不污染原来的data，深拷贝一份
            let _data = JSON.parse(JSON.stringify(this.data))
            let bufferDep = []
            Object.keys(_data).map(key => {
                let val = _data[key]
                Object.defineProperty(_data, key, {
                    // 触发收集
                    get: function () {
                        bufferDep.push(key)
                        return val
                    }
                })
            })
            Object.keys(app.computed).map(key => {
                // 重置依赖
                bufferDep = []
                this.setData({
                    // 下面这里调一下computed将值挂载到data上，并且同时会触发收集
                    [key]: app.computed[key].call(this, _data)
                }, function () {
                    // 将每一个computed的依赖存好
                    dep[key] = bufferDep
                })
            })
        }
        oldOnLoad.call(this, options)
    }
    return oldPage(app)
}