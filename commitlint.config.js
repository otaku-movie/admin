// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2, // 严格校验（error）
      'always',
      [
        'feat', // 新功能
        'fix', // 修复 bug
        'docs', // 文档
        'style', // 代码格式（不影响逻辑）
        'refactor', // 重构
        'perf', // 性能优化
        'test', // 测试
        'chore', // 构建过程或辅助工具变动
        'ci', // 持续集成相关
        // 你可以继续添加你想支持的类型
        'build',
        'release'
      ]
    ],
    'type-empty': [2, 'never'], // type 不能为空
    'subject-empty': [2, 'never'], // subject 不能为空
    'subject-max-length': [2, 'always', 100] // subject 最大长度100
  }
}
