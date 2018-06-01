import axios from "axios"
import { ObjectUtility } from "@/utils/ObjectUtility"
import { TypeUtility } from "@/utils/TypeUtility"
// import mock from 'mockjs'

export default class Api {

    //接口地址
    apiUrl = "localhost:4200";

    constructor() {
        // axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
        // axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

        //使用mockjs
        // mock.mock(this.apiUrl, {
        //     'name|3': 'fei',
        //     'age|20-30': 25,
        // })
    }

    // 参数过滤函数
    filterNull(o) {
        for (var key in o) {
            if (o[key] === null) {
                delete o[key]
            }
            if (TypeUtility.isString(o[key])) {
                o[key] = o[key].trim()
            } else if (TypeUtility.isObject(o[key])) {
                o[key] = filterNull(o[key])
            } else if (TypeUtility.isArray(o[key])) {
                o[key] = filterNull(o[key])
            }
        }
        return o
    }

    apiAxios(method, url, params, success, failure) {
        if (params) {
            params = this.filterNull(params)
        }
        axios({
            method: method,
            url: url,
            data: method === 'POST' || method === 'PUT' ? params : null,
            params: method === 'GET' || method === 'DELETE' ? params : null,
            baseURL: this.apiUrl,
            withCredentials: false
        }).then(function (res) {
            if (res.data.status === 200) {
                if (success) {
                    success(res.data)
                }
            } else {
                if (failure) {
                    failure(res.data)
                } else {
                    window.alert('error: ' + JSON.stringify(res.data))
                }
            }
        }).catch(function (err) {
            let res = err.response
            if (err) {
                window.alert('api error, HTTP CODE: ' + res.status)
            }
        })
    }

    get = (url, params, success, failure) => {
        this.apiAxios("GET", url, params, success, failure)
    }

    post = (url, params, success, failure) => {
        this.apiAxios("POST", url, params, success, failure)
    }

    put = (url, params, success, failure) => {
        this.apiAxios("PUT", url, params, success, failure)
    }

    delete = (url, params, success, failure) => {
        this.apiAxios("DELETE", url, params, success, failure)
    }
}