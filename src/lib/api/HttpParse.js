import axios from 'axios'

let _project = 'erpServiceManager'

export let ExecAsync = (functionName, interfaceName, interfaceType, args) => {
    let url = _project + '/' + functionName + '/' + interfaceName
    return new Promise((resovle, reject) => {
        ExecAsyncAxios(url, interfaceType, args, resovle, reject)
    })
}

function ExecAsyncAxios(url, type = 'get', args, resolve, reject) {
    axios({
        method: type,
        url: url,
        data: args
    }).then((res) => {
        if (res.data.status === 200) {
            resolve(res.data.result)
        } else {
            reject(res.data)
        }
    }).catch((err) => {
        reject({ status: 500, message: err })
    })
}