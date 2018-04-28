import { ExecAsync } from './HttpParse'

let user = [
    { method: 'requestRegister', type: 'get' }
]

let ApiNames = {
    user
}

export default class Api {
    constructor() {
        let self = this
        for (let api in ApiNames) {
            ApiNames[api].map((item) => {
                self[item.name] = (...args) => {
                    return ExecAsync(api, item.name, item.type, [...args])
                }
            })
        }
    }
}