const fs = require('node:fs')
const path = require('path')
const merge = require('lodash/merge')

const locale = path.resolve(__dirname, '../i18n/locales')

const zhCN = path.join(locale, './zh-CN')
const ja = path.join(locale, './ja')
const enUS = path.join(locale, './en-US')

const LANGS = ['zhCN', 'ja', 'enUS']

// 读取某个语言目录下所有文件内容，返回 { filename: json }
const readFile = (langPath) => {
  const files = fs.readdirSync(langPath)
  return files.reduce((obj, file) => {
    const filepath = path.resolve(langPath, file)
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' })
    obj[file] = JSON.parse(content)
    return obj
  }, {})
}

// 递归把每个字段变成{ zhCN: val, ja: val, enUS: val }
const combineLangData = (data, langKey) => {
  return Object.keys(data).reduce((obj, key) => {
    const val = data[key]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // 递归合并子对象
      obj[key] = combineLangData(val, langKey)
    } else {
      // 叶子节点，创建语言对象
      obj[key] = { [langKey]: val != null ? val : '' }
    }
    return obj
  }, {})
}

// 递归合并三种语言数据
const mergeLangObjects = (target, source) => {
  for (const key in source) {
    // eslint-disable-next-line no-prototype-builtins
    if (source.hasOwnProperty(key)) {
      if (
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        source[key] !== null &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key]) &&
        target[key] !== null
      ) {
        // 两边都是对象，递归合并
        mergeLangObjects(target[key], source[key])
      } else {
        // 直接赋值覆盖
        target[key] = source[key]
      }
    }
  }
}

// 递归补全每个叶子对象的语言字段
function fillMissingLangs(obj) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const keys = Object.keys(obj)
    const isLeafLangObj = keys.every(k => LANGS.includes(k))
    if (isLeafLangObj) {
      LANGS.forEach(lang => {
        if (!(lang in obj)) {
          obj[lang] = ''
        }
      })
    } else {
      keys.forEach(k => fillMissingLangs(obj[k]))
    }
  }
}

// 读取语言文件夹数据
const data = {
  zhCN: readFile(zhCN),
  ja: readFile(ja),
  enUS: readFile(enUS)
}

const result = {}

// 先分别转换成统一结构
const zhData = combineLangData(data.zhCN, 'zhCN')
const jaData = combineLangData(data.ja, 'ja')
const enData = combineLangData(data.enUS, 'enUS')

// 合并三种语言数据
mergeLangObjects(result, zhData)
mergeLangObjects(result, jaData)
mergeLangObjects(result, enData)

// 补全所有叶子语言字段
fillMissingLangs(result)

// 写文件
fs.writeFileSync(
  path.resolve(__dirname, './i18n/index.json'),
  JSON.stringify(result, null, 2),
  'utf-8'
)

console.log('合并完成！')
