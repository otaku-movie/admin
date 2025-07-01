const fs = require('fs')
const path = require('path')

const indexJsonPath = path.resolve(__dirname, './i18n/index.json') // index.json 路径
const outputDir = path.resolve(__dirname, '../i18n/locales') // 输出路径

const indexData = JSON.parse(fs.readFileSync(indexJsonPath, 'utf-8'))
const langMap = {
  zhCN: 'zh-CN',
  ja: 'ja',
  enUS: 'en-US'
}
const languages = Object.keys(langMap)

languages.forEach((langKey) => {
  const langCode = langMap[langKey]

  for (const fileName in indexData) {
    const content = extractLangContent(indexData[fileName], langKey)
    const targetDir = path.join(outputDir, langCode)
    const targetPath = path.join(targetDir, fileName)

    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(
      targetPath,
      JSON.stringify(content, null, 2) + '\n',
      'utf-8'
    )
  }
})

function extractLangContent(obj, lang) {
  if (typeof obj !== 'object' || obj === null) return obj

  const keys = Object.keys(obj)
  const isLangLeaf = ['zhCN', 'ja', 'enUS'].every((k) => keys.includes(k))

  if (isLangLeaf) {
    return obj[lang] ?? ''
  }

  const result = {}
  for (const key in obj) {
    result[key] = extractLangContent(obj[key], lang)
  }
  return result
}
