feat(cinema): 添加2D/3D规格支持和价格配置功能

## 主要修改

### 影院管理
- 添加2D/3D规格（dimensionType）字典类型
- 影院详情页面新增价格配置功能
- 影院详情页面新增票种管理功能（整合原独立票种页面）
- 价格配置支持按2D/3D规格设置加价
- 删除独立的票种管理页面和模态框（功能整合到影院详情）

### 上映场次管理
- 优化样式，使用CSS类替代内联样式
- 改进日期选择器UI和交互
- 优化表格布局，使用CSS变量动态设置列宽
- 改进无障碍访问性（aria-label、title等）

### 开发环境
- 配置 Git Bash 为默认终端
- 配置 PowerShell 执行策略绕过

### 国际化
- 更新影院详情、上映场次、票种相关翻译文件
- 支持中文、日文、英文三种语言

## 修改文件

### 新增
- `src/dialog/priceConfigModal.tsx` - 价格配置模态框
- `src/app/[lng]/cinema/cinemaList/screeningManagement/style.scss` - 样式文件

### 修改
- `.vscode/settings.json` - 终端配置
- `src/enum/dict.ts` - 添加 DIMENSION_TYPE 字典类型
- `src/app/[lng]/cinema/cinemaList/cinemaDetail/page.tsx` - 价格配置和票种管理
- `src/app/[lng]/cinema/cinemaList/screeningManagement/page.tsx` - 样式优化
- `src/app/i18n/locales/**/cinemaDetail.json` - 影院详情翻译
- `src/app/i18n/locales/**/screeningManagment.json` - 上映场次翻译
- `src/app/i18n/locales/**/ticketType.json` - 票种翻译

### 删除
- `src/app/[lng]/cinema/cinemaList/cinemaDetail/page copy.tsx` - 备份文件
- `src/app/[lng]/cinema/cinemaList/ticketType/page.tsx` - 独立票种页面（功能整合到影院详情）
- `src/dialog/ticketTypeModal.tsx` - 票种模态框（功能整合到影院详情）
