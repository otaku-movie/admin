This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000/zh-CN/movie](http://localhost:3000/zh-CN/movie) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## language

- Chinese
- Japanese

## 代办列表

- 搜索完善
- 座位拖拽选中bug
- 支付方式统计
- 登录拼图验证码
- 选座的并发处理
- 订单支付
- 票房统计
- loading
- 特典
- 固定票价
- movie ticket 预售票

> 功能

- 电影图片以及预告片列表
- 重映
- 配音

## stack

![React](public/logo/React.png)
![React](public/logo/TypeScript.png)

## screenshot

![login](./screenshot/01.png)
![movie list](./screenshot/02.png)
![movie detail](./screenshot/03.png)
![character](./screenshot/04.png)
![showtime](./screenshot/05.png)
![menu](./screenshot/06.png)
![permission](./screenshot/07.png)
![button](./screenshot/08.png)

页面加一个版本信息按钮

点击版本信息，用来添加版本信息（上映日期 语言 等）

然后还有个表格，可以用来添加角色，同一个角色可能有多个人配音或者参演，

添加配音版的时候，角色要同步，默认显示原版配音
