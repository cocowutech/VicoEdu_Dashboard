# Vico Education 财务计算器 - 开发需求说明

## 一、项目概述

我需要一个带后台和数据库的个人战略规划应用，核心功能是**财务计算器**，用 Unit Economics（单位经济学）的思维来计算我的教育培训业务收入。

**技术栈要求：**
- 前端：React + TypeScript + Tailwind CSS
- 后端：Node.js + Express 或 Next.js API Routes
- 数据库：PostgreSQL 或 SQLite
- ORM：Prisma
- 所有数据需要持久化保存，刷新页面后数据不丢失

---

## 二、核心功能：财务计算器

### 2.1 直播课班级表格

这是一个可编辑的表格，用户可以添加多个班级，每个班级有以下字段：

**输入字段（用户可编辑）：**
| 字段名 | 说明 | 示例值 |
|-------|------|--------|
| 班级名称 | 文本，班级的名字 | "PET周末班" |
| 学员时薪 | 每位学员每小时支付的费用（元） | 350 |
| 人数 | 班级学员人数 | 5 |
| 每课时长 | 每节课的时长（小时），允许小数点，如1.5表示1小时30分钟 | 1.5 |
| 周课次 | 每周上课的次数 | 2 |
| 教师时薪 | 支付给老师的每小时费用（元） | 200 |
| 总课次 | 整个学期/课程的总上课次数 | 20 |

**计算字段（自动计算，不可编辑）：**
| 字段名 | 计算公式 |
|-------|---------|
| 周课时 | = 每课时长 × 周课次 |
| 总课时 | = 每课时长 × 总课次 |
| 每小时收入 | = 学员时薪 × 人数 |
| 每小时利润 | = 每小时收入 - 教师时薪 |
| 月利润 | = 每小时利润 × 周课时 × 4（周） |
| 课程总利润 | = 每小时利润 × 总课时 |

**表格列显示顺序（从左到右）：**
1. 班级名称 (可编辑)
2. 学员时薪 (可编辑)
3. 人数 (可编辑)
4. 每课时长 (可编辑，允许小数)
5. 周课次 (可编辑)
6. 教师时薪 (可编辑)
7. 总课次 (可编辑)
8. 周课时 (自动计算，灰色背景)
9. 总课时 (自动计算，灰色背景)
10. 每小时收入 (自动计算，浅绿色背景)
11. 每小时利润 (自动计算，浅绿色背景)
12. 月利润 (自动计算，浅蓝色背景)
13. 课程总利润 (自动计算，浅紫色背景)
14. 操作 (删除按钮)

**表格底部显示合计：**
- 总人数（所有班级学员数之和）
- 月利润合计（所有班级月利润之和）
- 课程总利润合计（所有班级课程总利润之和）

**Unit Economics 统计卡片（显示在表格下方）：**
- 平均每小时收入 = 所有班级每小时收入的加权平均
- 平均每小时成本 = 所有班级教师时薪的加权平均
- 平均每小时利润 = 平均每小时收入 - 平均每小时成本
- 平均利润率 = 平均每小时利润 / 平均每小时收入 × 100%

---

### 2.2 录播陪跑营表格

这是另一个可编辑的表格，用户可以添加多个营期。

**预设产品数据（原始数据）：**
当用户选择预设产品时，自动填充对应的默认定价：

| 产品名称 | 默认定价(元) | 默认销售分佣(%) | 默认运营分佣(%) | 默认人均其他成本(元) |
|---------|-------------|----------------|----------------|-------------------|
| KET全程营(带直播) | 7,800 | 35 | 65 | 100 |
| KET考冲营(带直播) | 4,800 | 35 | 65 | 80 |
| KET全程营(不带直播) | 5,800 | 25 | 65 | 100 |
| KET考冲营(不带直播) | 3,500 | 25 | 65 | 80 |
| PET全程营(带直播) | 8,800 | 35 | 65 | 120 |
| PET考冲营(带直播) | 5,800 | 35 | 65 | 80 |
| PET全程营(不带直播) | 6,000 | 25 | 65 | 120 |
| PET考冲营(不带直播) | 4,500 | 25 | 65 | 80 |
| FCE全程营(带直播) | 12,800 | 35 | 65 | 150 |
| FCE考冲营(带直播) | 9,800 | 35 | 65 | 100 |
| FCE全程营(不带直播) | 7,000 | 25 | 65 | 150 |
| FCE教材部分 | 3,000 | 25 | 65 | 80 |
| 自定义 | (手动输入) | 30 | 65 | 100 |

**输入字段（用户可编辑）：**
| 字段名 | 说明 | 示例值 |
|-------|------|--------|
| 产品选择 | 下拉菜单，选择预设产品，选择后自动填充定价等默认值 | "KET全程营(带直播)" |
| 营期名称 | 文本，可修改，默认为产品名称 | "KET全程营(带直播)-1月班" |
| 定价 | 每位学员的报名费（元），选择产品后自动填充，可手动修改 | 7800 |
| 学员数 | 报名学员人数 | 15 |
| 销售分佣 | 销售人员的分佣比例（%），选择产品后自动填充，可手动修改 | 35 |
| 运营分佣 | 运营老师的分佣比例（%），基于扣除销售分佣后的金额 | 65 |
| 人均其他成本 | 教材、平台等每位学员的其他成本（元） | 100 |

**计算字段（自动计算，不可编辑）：**
| 字段名 | 计算公式 |
|-------|---------|
| 人均销售成本 | = 定价 × 销售分佣% |
| 人均运营成本 | = (定价 - 人均销售成本) × 运营分佣% |
| 人均利润 | = 定价 - 人均销售成本 - 人均运营成本 - 人均其他成本 |
| 总营收 | = 定价 × 学员数 |
| 总利润 | = 人均利润 × 学员数 |

**表格列显示顺序（从左到右）：**
1. 产品选择 (下拉菜单，选择后自动填充后续默认值)
2. 营期名称 (可编辑，默认=产品名称)
3. 定价 (可编辑，选择产品后自动填充)
4. 学员数 (可编辑)
5. 销售分佣% (可编辑，选择产品后自动填充)
6. 运营分佣% (可编辑，选择产品后自动填充)
7. 人均其他成本 (可编辑，选择产品后自动填充)
8. 人均销售成本 (自动计算，浅黄色背景)
9. 人均运营成本 (自动计算，浅黄色背景)
10. 人均利润 (自动计算，浅绿色背景)
11. 总营收 (自动计算，浅蓝色背景)
12. 总利润 (自动计算，浅紫色背景)
13. 操作 (删除按钮)

**表格底部显示合计：**
- 总学员数
- 总营收合计
- 总利润合计

**Unit Economics 统计卡片（显示在表格下方）：**
- 平均客单价 = 总营收 / 总学员数
- 平均销售成本 = 所有营期销售成本之和 / 总学员数
- 平均运营成本 = 所有营期运营成本之和 / 总学员数
- 平均人均利润 = 总利润 / 总学员数
- 平均利润率 = 总利润 / 总营收 × 100%

---

### 2.3 固定成本

一个简单的输入区域，包含：
- 小鹅通平台费（元/月），默认值 833（年费10000÷12）
- 其他平台/工具费（元/月），默认值 200
- 固定成本合计 = 以上两项之和

---

### 2.4 综合收入汇总

显示以下内容：
- 直播课月利润（来自直播课表格合计）
- 录播营利润（来自录播营表格合计）
- 固定成本（负数，来自固定成本区域）
- **净月收入** = 直播课月利润 + 录播营利润 - 固定成本
- 美元换算 = 净月收入 / 7.2

---

## 三、预设产品管理功能

用户可以自己添加、编辑、删除预设产品类型，方便后续快速选择。

**功能入口：** 在录播营表格上方或设置页面中，添加一个「管理预设产品」按钮

**预设产品编辑表单字段：**
| 字段名 | 说明 | 必填 |
|-------|------|-----|
| 产品名称 | 如"托福全程营(带直播)" | 是 |
| 考试类型 | 下拉选择：KET/PET/FCE/托福/小托福/其他 | 是 |
| 营期类型 | 下拉选择：全程营/考冲营/教材部分 | 是 |
| 是否带直播 | 开关 | 是 |
| 默认定价 | 数字（元） | 是 |
| 默认销售分佣 | 数字（%） | 是 |
| 默认运营分佣 | 数字（%） | 是 |
| 默认人均其他成本 | 数字（元） | 是 |
| 排序 | 数字，越小越靠前 | 否 |
| 是否启用 | 开关，关闭后不在下拉菜单中显示 | 是 |

**交互要求：**
1. 点击「管理预设产品」打开弹窗或跳转到管理页面
2. 显示所有预设产品列表，支持编辑和删除
3. 点击「添加新产品」可以创建新的预设产品
4. 编辑后实时保存到数据库
5. 删除时需要二次确认
6. 已被录播营引用的产品删除时提示警告（但允许删除，引用的营期保留原数据）

---

## 四、交互要求

1. **表格可直接编辑**：点击单元格中的数值可以直接修改，修改后自动重新计算所有相关字段
2. **添加/删除行**：每个表格有"添加"按钮，每行有"删除"按钮
3. **实时计算**：任何输入变化都实时更新所有计算结果
4. **数据持久化**：所有数据保存到数据库，刷新页面后数据不丢失
5. **响应式设计**：在手机和电脑上都能正常使用

---

## 四、数据库设计

### 直播课班级表 (live_classes)
```
id: 自增主键
name: 字符串，班级名称
student_hourly_rate: 数字，学员时薪（元/人/小时）
student_count: 整数，人数
lesson_duration: 数字(允许小数)，每课时长（小时）
weekly_lessons: 整数，周课次
teacher_hourly_rate: 数字，教师时薪（元/小时）
total_lessons: 整数，总课次
created_at: 时间戳
updated_at: 时间戳
```
注意：周课时和总课时是计算字段，不存数据库
- 周课时 = lesson_duration × weekly_lessons
- 总课时 = lesson_duration × total_lessons

### 录播陪跑营表 (recorded_camps)
```
id: 自增主键
product_id: 整数，关联预设产品表（可为空，表示自定义）
name: 字符串，营期名称
price: 数字，定价
student_count: 整数，学员数
sales_commission_rate: 数字，销售分佣比例（0-100）
ops_commission_rate: 数字，运营分佣比例（0-100）
other_cost_per_student: 数字，人均其他成本
created_at: 时间戳
updated_at: 时间戳
```

### 预设产品表 (preset_products)
```
id: 自增主键
name: 字符串，产品名称（如"KET全程营(带直播)"）
default_price: 数字，默认定价
default_sales_rate: 数字，默认销售分佣比例
default_ops_rate: 数字，默认运营分佣比例
default_other_cost: 数字，默认人均其他成本
exam_type: 字符串，考试类型（KET/PET/FCE）
has_live: 布尔，是否带直播
camp_type: 字符串，营期类型（full/sprint/textbook）
sort_order: 整数，排序顺序
is_active: 布尔，是否启用
created_at: 时间戳
updated_at: 时间戳
```

### 固定成本表 (fixed_costs)
```
id: 自增主键
name: 字符串，成本名称
amount: 数字，金额（元/月）
created_at: 时间戳
updated_at: 时间戳
```

---

## 五、API 接口

### 直播课班级
- GET /api/live-classes - 获取所有班级
- POST /api/live-classes - 创建班级
- PUT /api/live-classes/:id - 更新班级
- DELETE /api/live-classes/:id - 删除班级

### 预设产品
- GET /api/preset-products - 获取所有预设产品（用于下拉菜单）
- POST /api/preset-products - 创建新的预设产品
- PUT /api/preset-products/:id - 编辑预设产品
- DELETE /api/preset-products/:id - 删除预设产品

### 录播陪跑营
- GET /api/recorded-camps - 获取所有营期
- POST /api/recorded-camps - 创建营期
- PUT /api/recorded-camps/:id - 更新营期
- DELETE /api/recorded-camps/:id - 删除营期

### 固定成本
- GET /api/fixed-costs - 获取所有固定成本
- PUT /api/fixed-costs/:id - 更新固定成本

---

## 六、默认数据（初始化时插入）

### 直播课班级默认数据
```json
[
  {
    "name": "PET周末班",
    "student_hourly_rate": 350,
    "student_count": 6,
    "lesson_duration": 1.5,
    "weekly_lessons": 2,
    "teacher_hourly_rate": 200,
    "total_lessons": 20
  },
  {
    "name": "FCE强化班",
    "student_hourly_rate": 400,
    "student_count": 4,
    "lesson_duration": 2,
    "weekly_lessons": 2,
    "teacher_hourly_rate": 250,
    "total_lessons": 16
  }
]
```
说明：
- PET周末班：每课1.5小时，每周2次，共20次课 → 周课时=3小时，总课时=30小时
- FCE强化班：每课2小时，每周2次，共16次课 → 周课时=4小时，总课时=32小时

### 预设产品默认数据（初始化时插入到 preset_products 表）
```json
[
  {"id": 1, "name": "KET全程营(带直播)", "default_price": 7800, "default_sales_rate": 35, "default_ops_rate": 65, "default_other_cost": 100, "exam_type": "KET", "has_live": true, "camp_type": "full", "sort_order": 1},
  {"id": 2, "name": "KET考冲营(带直播)", "default_price": 4800, "default_sales_rate": 35, "default_ops_rate": 65, "default_other_cost": 80, "exam_type": "KET", "has_live": true, "camp_type": "sprint", "sort_order": 2},
  {"id": 3, "name": "KET全程营(不带直播)", "default_price": 5800, "default_sales_rate": 25, "default_ops_rate": 65, "default_other_cost": 100, "exam_type": "KET", "has_live": false, "camp_type": "full", "sort_order": 3},
  {"id": 4, "name": "KET考冲营(不带直播)", "default_price": 3500, "default_sales_rate": 25, "default_ops_rate": 65, "default_other_cost": 80, "exam_type": "KET", "has_live": false, "camp_type": "sprint", "sort_order": 4},
  {"id": 5, "name": "PET全程营(带直播)", "default_price": 8800, "default_sales_rate": 35, "default_ops_rate": 65, "default_other_cost": 120, "exam_type": "PET", "has_live": true, "camp_type": "full", "sort_order": 5},
  {"id": 6, "name": "PET考冲营(带直播)", "default_price": 5800, "default_sales_rate": 35, "default_ops_rate": 65, "default_other_cost": 80, "exam_type": "PET", "has_live": true, "camp_type": "sprint", "sort_order": 6},
  {"id": 7, "name": "PET全程营(不带直播)", "default_price": 6000, "default_sales_rate": 25, "default_ops_rate": 65, "default_other_cost": 120, "exam_type": "PET", "has_live": false, "camp_type": "full", "sort_order": 7},
  {"id": 8, "name": "PET考冲营(不带直播)", "default_price": 4500, "default_sales_rate": 25, "default_ops_rate": 65, "default_other_cost": 80, "exam_type": "PET", "has_live": false, "camp_type": "sprint", "sort_order": 8},
  {"id": 9, "name": "FCE全程营(带直播)", "default_price": 12800, "default_sales_rate": 35, "default_ops_rate": 65, "default_other_cost": 150, "exam_type": "FCE", "has_live": true, "camp_type": "full", "sort_order": 9},
  {"id": 10, "name": "FCE考冲营(带直播)", "default_price": 9800, "default_sales_rate": 35, "default_ops_rate": 65, "default_other_cost": 100, "exam_type": "FCE", "has_live": true, "camp_type": "sprint", "sort_order": 10},
  {"id": 11, "name": "FCE全程营(不带直播)", "default_price": 7000, "default_sales_rate": 25, "default_ops_rate": 65, "default_other_cost": 150, "exam_type": "FCE", "has_live": false, "camp_type": "full", "sort_order": 11},
  {"id": 12, "name": "FCE教材部分", "default_price": 3000, "default_sales_rate": 25, "default_ops_rate": 65, "default_other_cost": 80, "exam_type": "FCE", "has_live": false, "camp_type": "textbook", "sort_order": 12}
]
```

### 录播陪跑营默认数据（示例数据，插入到 recorded_camps 表）
```json
[
  {
    "product_id": 1,
    "name": "KET全程营(带直播)-1月班",
    "price": 7800,
    "student_count": 15,
    "sales_commission_rate": 35,
    "ops_commission_rate": 65,
    "other_cost_per_student": 100
  },
  {
    "product_id": 8,
    "name": "PET考冲营(不带直播)-寒假班",
    "price": 4500,
    "student_count": 20,
    "sales_commission_rate": 25,
    "ops_commission_rate": 65,
    "other_cost_per_student": 80
  }
]
```

### 固定成本默认数据
```json
[
  {"name": "小鹅通平台费", "amount": 833},
  {"name": "其他工具费", "amount": 200}
]
```

---

## 七、UI 设计要求

1. **整体风格**：现代简洁，使用 Tailwind CSS
2. **配色**：
   - 直播课区域：紫色系
   - 录播营区域：橙色系
   - 收入/利润：绿色
   - 成本：红色
   - 汇总区域：渐变紫蓝色背景
3. **表格样式**：
   - 可编辑单元格：hover 时有淡蓝色背景提示
   - 计算结果列：有浅色背景区分（如浅绿色）
   - 合计行：加粗，灰色背景
4. **卡片样式**：圆角、阴影、内边距
5. **数字格式**：金额显示千分位，如 ¥12,345

---

## 八、计算示例

### 直播课示例
输入：
- 学员时薪: 350元
- 人数: 6人
- 每课时长: 1.5小时
- 周课次: 2次
- 教师时薪: 200元
- 总课次: 20次

计算：
- 周课时 = 1.5 × 2 = 3小时
- 总课时 = 1.5 × 20 = 30小时
- 每小时收入 = 350 × 6 = 2,100元
- 每小时利润 = 2,100 - 200 = 1,900元
- 月利润 = 1,900 × 3 × 4 = 22,800元
- 课程总利润 = 1,900 × 30 = 57,000元

### 录播营示例
用户操作：
1. 点击"添加陪跑营"
2. 在"产品选择"下拉菜单中选择"KET全程营(带直播)"
3. 系统自动填充：定价=7800，销售分佣=35%，运营分佣=65%，人均其他成本=100
4. 用户修改营期名称为"KET全程营(带直播)-1月班"
5. 用户输入学员数=15

计算（自动）：
- 人均销售成本 = 7,800 × 35% = 2,730元
- 人均运营成本 = (7,800 - 2,730) × 65% = 3,295.5元
- 人均利润 = 7,800 - 2,730 - 3,295.5 - 100 = 1,674.5元
- 总营收 = 7,800 × 15 = 117,000元
- 总利润 = 1,674.5 × 15 = 25,117.5元

---

## 九、开发优先级

1. **第一步**：搭建项目框架（Next.js + Prisma + SQLite）
2. **第二步**：实现数据库和 API
3. **第三步**：实现直播课表格（可编辑、实时计算）
4. **第四步**：实现录播营表格
5. **第五步**：实现固定成本和综合汇总
6. **第六步**：添加 Unit Economics 统计卡片
7. **第七步**：优化 UI 和响应式

---

## 十、文件结构建议

```
vico-dashboard/
├── prisma/
│   ├── schema.prisma          # 数据库模型
│   └── seed.ts                # 种子数据（预设产品等）
├── src/
│   ├── app/
│   │   ├── page.tsx           # 主页面
│   │   ├── layout.tsx         # 布局
│   │   ├── settings/
│   │   │   └── page.tsx       # 设置页面（管理预设产品）
│   │   └── api/
│   │       ├── live-classes/
│   │       │   └── route.ts   # 直播课 API
│   │       ├── preset-products/
│   │       │   ├── route.ts   # 预设产品列表/创建 API
│   │       │   └── [id]/
│   │       │       └── route.ts # 预设产品编辑/删除 API
│   │       ├── recorded-camps/
│   │       │   └── route.ts   # 录播营 API
│   │       └── fixed-costs/
│   │           └── route.ts   # 固定成本 API
│   ├── components/
│   │   ├── LiveClassTable.tsx
│   │   ├── RecordedCampTable.tsx
│   │   ├── ProductSelector.tsx    # 产品选择下拉组件
│   │   ├── PresetProductManager.tsx # 预设产品管理组件
│   │   ├── PresetProductForm.tsx  # 预设产品编辑表单
│   │   ├── FixedCosts.tsx
│   │   ├── Summary.tsx
│   │   └── UnitEconomicsCards.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Prisma 客户端
│   │   └── calculations.ts    # 计算函数
│   └── types/
│       └── index.ts           # TypeScript 类型
├── package.json
└── README.md
```

---

请按照以上需求帮我开发这个应用。先从第一步开始，搭建项目框架。
