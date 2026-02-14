## 技术栈

- React v18
- Typescript
- Next.js v14


## 目录说明
```
admin
├── AGENTS.md
├── COMMIT_MESSAGE.md
├── README.md
├── build
│   └── test
│       ├── app-build-manifest.json
│       ├── build-manifest.json
│       ├── cache
│       ├── fallback-build-manifest.json
│       ├── package.json
│       ├── react-loadable-manifest.json
│       ├── server
│       ├── static
│       ├── trace
│       └── types
├── commitlint.config.js
├── doc
│   └── movie_ticket_presale_rules.md
├── generator
│   ├── en-US.json
│   ├── read.js
│   ├── write.js
│   └── zh-CN.json
├── git_commit.txt
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── presale_summary.md
├── public
│   ├── logo
│   │   ├── Node.js.png
│   │   ├── React.png
│   │   └── TypeScript.png
│   ├── next.svg
│   └── vercel.svg
├── screenshot
│   ├── 01.png
│   ├── 02.png
│   ├── 03.png
│   ├── 04.png
│   ├── 05.png
│   ├── 06.png
│   ├── 07.png
│   └── 08.png
├── sonar-project.properties
├── src
│   ├── api
│   │   ├── index.ts
│   │   └── request
│   ├── app
│   │   ├── [lng]
│   │   ├── i18n
│   │   └── node
│   ├── assets
│   │   ├── css
│   │   ├── font
│   │   └── image
│   ├── components
│   │   ├── AppTimePicker
│   │   ├── CustomAntImage.tsx
│   │   ├── DictSelect.tsx
│   │   ├── ProgressHandler.tsx
│   │   ├── TodoList
│   │   ├── checkPermission.tsx
│   │   ├── cropper
│   │   ├── dict.tsx
│   │   ├── menu.tsx
│   │   ├── query.tsx
│   │   ├── rangePicker.tsx
│   │   ├── upload
│   │   └── verifyCode.tsx
│   ├── config
│   │   ├── enum.ts
│   │   ├── index.ts
│   │   ├── menu.tsx
│   │   ├── route.tsx
│   │   └── router.ts
│   ├── dialog
│   │   ├── BrandModal.tsx
│   │   ├── LanguageModal.tsx
│   │   ├── MovieTagModal.tsx
│   │   ├── ShowTimeTagModal.tsx
│   │   ├── buttonModal.tsx
│   │   ├── characterModal.tsx
│   │   ├── commentModal.tsx
│   │   ├── configUserRoleModal.tsx
│   │   ├── createOrderModal.tsx
│   │   ├── dictModal.tsx
│   │   ├── levelModal.tsx
│   │   ├── menuModal.tsx
│   │   ├── movieModal.tsx
│   │   ├── movieShowTimeModal
│   │   ├── movieShowTimeModal.tsx
│   │   ├── positionModal.tsx
│   │   ├── priceConfigModal.tsx
│   │   ├── reReleaseModal.tsx
│   │   ├── replyModal.tsx
│   │   ├── roleModal.tsx
│   │   ├── rolePermission.tsx
│   │   ├── seatModal
│   │   ├── selectActorModal.tsx
│   │   ├── selectCharacterModal.tsx
│   │   ├── selectStaffModal.tsx
│   │   ├── specModal.tsx
│   │   ├── staffModal.tsx
│   │   ├── theaterHallModal.tsx
│   │   └── userModal.tsx
│   ├── enum
│   │   └── dict.ts
│   ├── middleware.ts
│   ├── plugins
│   │   └── echarts.ts
│   ├── store
│   │   ├── useCommonStore.ts
│   │   ├── useMovieStore.ts
│   │   ├── usePermissionStore.ts
│   │   ├── usePricingStrategyStore.ts
│   │   └── useUserStore.ts
│   ├── type
│   │   ├── api.ts
│   │   ├── axios.d.ts
│   │   └── query
│   └── utils
│       ├── index.ts
│       ├── pagination.tsx
│       └── thirtyHourTime.ts
├── tailwind.config.ts
├── test.html
├── test.json
└── tsconfig.json
```

## 翻译文件
`src/app/i18n/locales/${lang}/xxx.json`

## 代码规范

- 代码凡是可以复用的尽量进行复用



## 提交规范
`commit message` 需要符合`commitlint`规范

## 前端
后端需要同步更改，表格通过拖拽进行调整优先级，后端接口返回的时候，按照优先级进行排序，删除手动输入数字调整优先级，

## 后端
后端需要移除活动相关信息，如果有增删字段需要生成变更的sql文件
