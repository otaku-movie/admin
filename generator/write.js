const fs = require('node:fs')
const path = require('path')

const locale = path.resolve(__dirname, '../src/app/i18n/locales')
const enUS = path.resolve(locale, './en-US')
const readPath = path.resolve(__dirname, './en-US.json')

const translate = fs.readFileSync(readPath, {
  encoding: 'utf-8'
})
console.log()

const readContent = JSON.parse(translate)

Object.keys(readContent).forEach(item => {
  const content = JSON.stringify(readContent[item], null, 2 )
  const writePath = path.resolve(enUS, item)

  fs.writeFileSync(writePath, content, {
    encoding: 'utf-8'
  })
})
