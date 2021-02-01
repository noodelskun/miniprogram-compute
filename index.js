/*
 * @Author: rkm
 * @Date: 2021-02-01 16:48:14
 * @LastEditTime: 2021-02-01 16:48:23
 * @FilePath: \miniprogram-compute\index.js
 * @LastEditors: rkm
 */
const oldPage = Page
Page = function (app) {
    let oldOnLoad = app.onLoad;
    app.onLoad = function (options) {
        let o_setData = this.setData
        let dep = {}
        this.setData = function (o, fn) {
            o_setData.call(this, o, function () {
                if (app.compute) {
                    Object.keys(dep).map(c => {
                        Object.keys(o).map(i => {
                            if (dep[c].includes(i) || dep[c].includes(i.split('.')[0]) || dep[c].includes(i.split('[')[0])) {
                                o_setData.call(this, {
                                    [c]: app.compute[c].call(this, this.data)
                                })
                            }
                        })
                    })
                }
                fn && fn.call(this)
            })
        }
        if (app.compute) {
            let _data = JSON.parse(JSON.stringify(this.data))
            let bufferDep = []
            Object.keys(_data).map(key => {
                let val = _data[key]
                Object.defineProperty(_data, key, {
                    get: function () {
                        bufferDep.push(key)
                        return val
                    }
                })
            })
            Object.keys(app.compute).map(key => {
                bufferDep = []
                this.setData({
                    [key]: app.compute[key].call(this, _data)
                }, function () {
                    dep[key] = bufferDep
                })
            })
        }
        oldOnLoad.call(this, options)
    }
    return oldPage(app)
}