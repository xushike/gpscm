/**
 * 使用mockjs模拟数据
 */

import Mock from 'mockjs'
import config from '@/../config/index'

// 获取 mock.Random 对象
const Random = Mock.Random;
// mock一组数据
const produceNewsData = function () {
    let data = [];
    for (let i = 0; i < 100; i++) {
        let newArticleObject = {
            date: Random.date() + ' ' + Random.time(),// Random.date()指示生成的日期字符串的格式,默认为yyyy-MM-dd；Random.time() 返回一个随机的时间字符串
            name: Random.cname(), // Random.cname() 随机生成一个常见的中文姓名
            address: Random.csentence(5, 30), //  Random.csentence( min, max )
            thumbnail_pic_s: Random.dataImage('300x250', 'mock的图片'), // Random.dataImage( size, text ) 生成一段随机的 Base64 图片编码
        }
        data.push(newArticleObject)
    }

    return {
        status:200,
        data: data
    }
}

// Mock.mock( url, post/get , 返回的数据)；
const apiUrl = `${config.dev.host}:${config.dev.port}/news/index`
Mock.mock(apiUrl, 'post', produceNewsData);