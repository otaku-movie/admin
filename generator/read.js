const fs = require('node:fs')
const path = require('path')

const locale = path.resolve(__dirname, '../src/app/i18n/locales')
const zhCN = path.resolve(locale, './zh-CN')

const result = fs.readdirSync(zhCN).reduce((obj, current) => {
  const file = path.resolve(zhCN, current)
  const content = fs.readFileSync(file, {
    encoding: 'utf-8'
  })

  obj[current] = JSON.parse(content)

  return obj
}, {})

fs.writeFileSync(
  path.resolve(__dirname, './zh-CN.json'),
  JSON.stringify(result, null, 2),
  {
    encoding: 'utf-8'
  }
)
