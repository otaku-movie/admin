/*
 * @Author: last order 2495713984@qq.com
 * @Date: 2025-03-03 15:23:23
 * @LastEditors: last order 2495713984@qq.com
 * @LastEditTime: 2025-03-03 16:58:56
 * @FilePath: \node\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const fs = require('node:fs')
const path = require('path')
const merge = require('lodash/merge')

const locale = path.resolve(__dirname, '../i18n/locales')

console.log(locale);
const zhCN = path.join(locale, './zh-CN')
const ja = path.join(locale, './ja')
const enUS = path.join(locale, './en-US')

console.log(zhCN);

const readFile = (lang) => {
  const files = fs.readdirSync(lang)
  const result = files.reduce((obj, current) => {
    const file = path.resolve(lang, current)
    const content = fs.readFileSync(file, {
      encoding: 'utf-8'
    })

    obj[current] = JSON.parse(content)

    return obj
  }, {})

  return result
}

const data = {
  zhCN: readFile(zhCN),
  ja: readFile(ja),
  enUS: readFile(enUS)
}

let result = {}


const fn = (data, lang = 'zh-CN') => {
  return Object.keys(data).reduce((obj, current) => {
    if (!obj[current]) {
      obj[current] = {}
    } 
    if (typeof data[current] === 'object') {
      obj[current] = fn(data[current], lang)
    } else {
      obj[current] = Object.assign(obj[current], {[lang]: data[current] ? data[current] : ''})
    }
    
    return obj
  }, {})
}

Object.keys(data).forEach(key => {
  result = merge(result, fn(data[key], key) ) 
})



fs.writeFileSync('./i18n/index.json', JSON.stringify(result, null, 2))