# {{APP_NAME}} 第三方 SDK 清单

**版本号**：1.0.0
**生效日期**：{{EFFECTIVE_DATE}}
**最近更新**：{{LAST_UPDATED}}

为保障 {{APP_NAME}} 的注册登录、定位选座、上传头像/反馈图片等功能正常运行，我们在 App 中集成了下列第三方 SDK 或系统服务。本清单仅作展示与告知用途，不需要您再次单独同意；具体收集与使用规则请同时参阅《隐私协议》。

> 本清单与 App 实际依赖（`pubspec.yaml`）保持一致，发版若有新增/移除将同步更新。

---

## 一、登录与身份认证

| SDK / 服务 | 提供方 | 使用目的 | 收集 / 使用的信息 | 触发场景 | 隐私政策 |
|---|---|---|---|---|---|
| `google_sign_in` | Google LLC | 通过 Google 账号登录 / 注册 | Google 账号 `sub` 标识、邮箱、昵称、头像 URL | 用户点击「Google 登录」时 | https://policies.google.com/privacy |
| `sign_in_with_apple` | Apple Inc. | 通过 Apple ID 登录 / 注册（仅 iOS） | Apple 账号 `sub` 标识、邮箱（可能为 Apple 中继地址）、昵称 | iOS 用户点击「Apple 登录」时 | https://www.apple.com/legal/privacy/ |
| `flutter_appauth` | OpenID AppAuth / Flutter 社区 | 通过 X 账号登录 / 注册 | X 用户标识、昵称、头像 URL、OAuth 2.0 Access Token（仅用于登录验证） | 用户点击「X 登录」时 | https://x.com/en/privacy |

---

## 二、设备能力与位置

| SDK / 服务 | 提供方 | 使用目的 | 收集 / 使用的信息 | 触发场景 | 隐私政策 |
|---|---|---|---|---|---|
| `geolocator` | Baseflow | 获取设备粗略位置 | GPS / 网络定位经纬度（设备授权后） | 推荐附近影院、就近选座 | https://baseflow.com/privacy-statement/ |
| `geocoding` | Baseflow（基于操作系统） | 经纬度反向解析为城市/地区 | 经纬度 | 同上，仅用于展示城市名 | 同上 |
| `image_picker` | Flutter 官方插件 | 选择/拍摄头像、反馈截图 | 系统相册中您选择的图片、相机拍摄的图片（不会自动遍历相册） | 修改头像、提交反馈、上传评论图片 | 受 Android / iOS 系统隐私权限管控 |
| `image_editor` | Flutter 社区 | 头像裁剪 / 旋转 | 您选择的图片（仅本地处理） | 同 `image_picker`，处理后再上传服务端 | 仅本地处理，不上传第三方 |

> 上述位置、相册、相机能力均通过 Android / iOS 系统权限弹窗向您请求授权，您可随时在系统设置中关闭。

---

## 三、本地数据存储（不离开本设备）

| SDK / 服务 | 提供方 | 使用目的 | 存储的信息 |
|---|---|---|---|
| `flutter_secure_storage` | Flutter 社区 | iOS Keychain / Android Keystore 加密保存敏感凭证 | `accessToken` / `refreshToken` / `deviceId` |
| `shared_preferences` | Flutter 官方插件 | 保存非敏感偏好 | 语言、首页 Tab、引导页是否已读等 |

上述数据**不会**上传至第三方，仅保存在您的设备本地；卸载 App 即一并清除。

---

## 四、网络请求与展示

| SDK / 服务 | 提供方 | 使用目的 | 涉及的信息 |
|---|---|---|---|
| `dio` | Flutter 社区 | App 与本平台后端（`{{API_DOMAIN}}`）之间的 HTTPS 通信 | 业务请求参数、Bearer Token、设备 ID（请求头）|
| `extended_image` | Flutter 社区 | 加载海报、剧照、头像并做磁盘缓存 | 仅本地缓存图片，不向第三方上报 |
| `flutter_markdown` | Flutter 官方插件 | 渲染服务端下发的协议正文等 Markdown | 仅本地渲染 |
| `url_launcher` | Flutter 官方插件 | 点击外部链接（如第三方隐私政策、客服邮箱）跳转到浏览器或邮件 App | 仅在您点击对应入口时调起系统应用 |

---

## 五、辅助工具（不收集个人信息）

| SDK / 服务 | 用途 |
|---|---|
| `package_info_plus` | 读取 App 自身版本号，用于版本检查与展示 |
| `uuid` | 生成本机 `deviceId`，用于 Refresh Token 绑定 |
| `crypto` | 本地哈希计算 |
| `logger` / `pretty_dio_logger` | 仅在开发/调试环境打印日志，正式包不输出 |
| `flutter_screenutil` / `fluttertoast` / `easy_refresh` / `card_swiper` / `carousel_slider` / `pretty_qr_code` / `flutter_sticky_header` / `loading_animation_widget` / `jiffy` / `flutter_svg` | UI 展示、动画、时间格式化等纯前端能力，不联网、不收集个人信息 |

---

## 六、暂未接入的第三方服务

为避免误导，以下功能**目前尚未接入**，待后续接入时本清单会同步更新并提示您：

- 消息推送（Firebase Cloud Messaging / APNs）
- 在线支付（Stripe / PayPay / Apple Pay / Google Pay 等）
- 崩溃监控与错误日志（Sentry / Firebase Crashlytics）
- 行为统计与分析（Firebase Analytics / 友盟 / GA4 等）
- 第三方地图组件（Google Maps / Apple MapKit JS）

---

## 七、清单维护说明

1. 本清单基于 App 当前发行版本的 `pubspec.yaml` 实际依赖整理，会与 App 版本号联动更新。
2. 若新增第三方 SDK 涉及收集个人信息，我们将：
   - 更新本清单与对应隐私协议章节；
   - 重大变更通过 App 弹窗 / 邮件等显著方式通知您，并在必要时请求您重新同意。
3. 如您对清单中任何条目存有疑问，可通过 {{DPO_EMAIL}} 联系我们。
