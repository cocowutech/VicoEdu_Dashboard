# Vico Education 战略仪表盘 - 产品需求文档 (PRD)

## 项目概述

### 产品名称
**Vico Strategic Dashboard** (Vico 战略仪表盘)

### 产品定位
一个面向教育创业者的个人战略规划与业务管理工具，帮助用户：
- 梳理产品矩阵和定价策略
- 动态计算财务目标和利润
- 跟踪执行进度和关键指标
- 规划 AI 自动化工作流

### 目标用户
教育行业创业者、培训机构负责人、独立教师

---

## 技术栈要求

### 推荐方案 A：全栈 JavaScript (适合快速开发)
```
前端: React + TypeScript + Tailwind CSS
后端: Node.js + Express
数据库: PostgreSQL (或 SQLite 本地开发)
ORM: Prisma
认证: JWT + bcrypt
部署: Vercel (前端) + Railway/Render (后端)
```

### 推荐方案 B：Python 后端 (适合 AI 集成)
```
前端: React + TypeScript + Tailwind CSS
后端: Python + FastAPI
数据库: PostgreSQL
ORM: SQLAlchemy
认证: JWT + passlib
部署: Vercel (前端) + Railway (后端)
```

### 推荐方案 C：简化版 (单人使用)
```
全栈: Next.js 14 (App Router)
数据库: SQLite (本地) 或 Supabase (云端)
ORM: Prisma
认证: NextAuth.js (可选)
部署: Vercel
```

---

## 数据库设计

### 核心数据表

```sql
-- 用户表 (如果需要多用户)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 战略定位表
CREATE TABLE strategic_positioning (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  current_phase VARCHAR(50), -- 'rising', 'stable', 'transition', 'declining'
  one_liner TEXT, -- 战略定位一句话
  dimension1_strengths TEXT, -- 事半功倍点
  dimension2_pain_points TEXT, -- 市场痛点
  dimension3_resources TEXT, -- 靠近钱和资源
  strategic_focus TEXT, -- 三维交集发力点
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 产品表
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  category VARCHAR(50) NOT NULL, -- 'live_course', 'recorded_camp'
  exam_type VARCHAR(50) NOT NULL, -- 'KET', 'PET', 'FCE', 'TOEFL', 'TOEFL_Junior', 'SSAT', 'SAT'
  product_name VARCHAR(200) NOT NULL,
  product_type VARCHAR(50), -- 'full', 'sprint', 'textbook' for camps; '1v1', 'small_class' for live
  has_live_service BOOLEAN DEFAULT false, -- 录播营是否带直播
  price DECIMAL(10,2) NOT NULL,
  is_outsourced BOOLEAN DEFAULT false, -- 是否外包给其他老师
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 成本参数表
CREATE TABLE cost_parameters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  parameter_name VARCHAR(100) NOT NULL,
  parameter_category VARCHAR(50), -- 'live_course', 'recorded_camp', 'platform', 'other'
  parameter_value DECIMAL(10,4) NOT NULL, -- 可以是百分比或固定金额
  value_type VARCHAR(20), -- 'percentage', 'fixed'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 默认成本参数数据
INSERT INTO cost_parameters (user_id, parameter_name, parameter_category, parameter_value, value_type, description) VALUES
(1, 'teacher_commission', 'live_course', 0.70, 'percentage', '直播课老师分成比例'),
(1, 'platform_fee_annual', 'platform', 10000, 'fixed', '小鹅通年费'),
(1, 'sales_commission_no_live', 'recorded_camp', 0.25, 'percentage', '录播营销售分成(不带直播)'),
(1, 'sales_commission_with_live', 'recorded_camp', 0.35, 'percentage', '录播营销售分成(带直播)'),
(1, 'ops_commission', 'recorded_camp', 0.65, 'percentage', '运营老师分成'),
(1, 'material_cost_ket', 'recorded_camp', 100, 'fixed', 'KET教材成本/人'),
(1, 'material_cost_pet', 'recorded_camp', 120, 'fixed', 'PET教材成本/人'),
(1, 'material_cost_fce', 'recorded_camp', 150, 'fixed', 'FCE教材成本/人');

-- 财务计算记录表 (保存用户的计算场景)
CREATE TABLE financial_scenarios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  scenario_name VARCHAR(200),
  scenario_type VARCHAR(50), -- 'live_course', 'recorded_camp', 'combined'
  
  -- 直播课参数
  live_class_count INTEGER,
  live_students_per_class INTEGER,
  live_price_per_hour DECIMAL(10,2),
  live_hours_per_week INTEGER,
  live_commission_rate DECIMAL(5,4),
  
  -- 录播营参数
  camp_product_id INTEGER REFERENCES products(id),
  camp_student_count INTEGER,
  camp_sales_rate DECIMAL(5,4),
  camp_ops_rate DECIMAL(5,4),
  camp_material_cost DECIMAL(10,2),
  
  -- 计算结果
  total_revenue DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  net_profit DECIMAL(12,2),
  profit_margin DECIMAL(5,4),
  
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 目标表
CREATE TABLE goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  goal_type VARCHAR(50), -- 'strategic', 'financial', 'recruitment', 'content'
  goal_name VARCHAR(200) NOT NULL,
  target_value DECIMAL(12,2),
  current_value DECIMAL(12,2) DEFAULT 0,
  unit VARCHAR(50), -- '人', '元', '条', '%'
  deadline DATE,
  period VARCHAR(20), -- 'weekly', 'monthly', 'quarterly', 'yearly'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 周跟踪记录表
CREATE TABLE weekly_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  
  -- 指标数据
  xhs_posts_target INTEGER,
  xhs_posts_actual INTEGER,
  new_followers_target INTEGER,
  new_followers_actual INTEGER,
  inquiries_target INTEGER,
  inquiries_actual INTEGER,
  trial_students_target INTEGER,
  trial_students_actual INTEGER,
  new_enrollments_target INTEGER,
  new_enrollments_actual INTEGER,
  revenue_target DECIMAL(12,2),
  revenue_actual DECIMAL(12,2),
  
  -- 复盘内容
  wins TEXT, -- 做对了什么
  challenges TEXT, -- 遇到什么卡点
  next_week_priorities TEXT, -- 下周最重要的3件事
  on_mainline VARCHAR(20), -- 'yes', 'deviated', 'need_adjust'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 月度复盘表
CREATE TABLE monthly_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  month DATE NOT NULL, -- 月份第一天
  
  -- 目标完成情况
  key_actions_completion TEXT,
  biggest_win TEXT,
  biggest_lesson TEXT,
  
  -- 战略调整
  mainline_adjustment VARCHAR(20), -- 'none', 'minor', 'major'
  adjustment_details TEXT,
  
  -- 下月计划
  next_month_focus TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI自动化任务表
CREATE TABLE ai_automations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  task_name VARCHAR(200) NOT NULL,
  description TEXT,
  tool_suggestion VARCHAR(200),
  priority INTEGER, -- 1-5, 5最高
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'paused'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 用户旅程/漏斗数据表
CREATE TABLE funnel_metrics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  record_date DATE NOT NULL,
  
  -- 漏斗各阶段数据
  stage1_awareness INTEGER, -- 曝光/粉丝数
  stage2_interest INTEGER, -- 私信/咨询数
  stage3_consideration INTEGER, -- 试听/测评数
  stage4_purchase INTEGER, -- 购买/入班数
  stage5_retention INTEGER, -- 复购/续费数
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 客户/学生表 (可选，用于详细管理)
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(100),
  parent_contact VARCHAR(200),
  source VARCHAR(100), -- 来源渠道
  current_stage VARCHAR(50), -- 当前漏斗阶段
  enrolled_products TEXT, -- JSON: 已报名产品ID列表
  total_paid DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Prisma Schema (如果使用 Prisma ORM)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // 或 "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  strategicPositioning StrategicPositioning?
  products             Product[]
  costParameters       CostParameter[]
  financialScenarios   FinancialScenario[]
  goals                Goal[]
  weeklyTracking       WeeklyTracking[]
  monthlyReviews       MonthlyReview[]
  aiAutomations        AiAutomation[]
  funnelMetrics        FunnelMetric[]
  students             Student[]

  @@map("users")
}

model StrategicPositioning {
  id               Int      @id @default(autoincrement())
  userId           Int      @unique @map("user_id")
  currentPhase     String?  @map("current_phase")
  oneLiner         String?  @map("one_liner")
  dimension1       String?  @map("dimension1_strengths")
  dimension2       String?  @map("dimension2_pain_points")
  dimension3       String?  @map("dimension3_resources")
  strategicFocus   String?  @map("strategic_focus")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@map("strategic_positioning")
}

model Product {
  id             Int      @id @default(autoincrement())
  userId         Int      @map("user_id")
  category       String
  examType       String   @map("exam_type")
  productName    String   @map("product_name")
  productType    String?  @map("product_type")
  hasLiveService Boolean  @default(false) @map("has_live_service")
  price          Decimal  @db.Decimal(10, 2)
  isOutsourced   Boolean  @default(false) @map("is_outsourced")
  isActive       Boolean  @default(true) @map("is_active")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user               User                @relation(fields: [userId], references: [id])
  financialScenarios FinancialScenario[]

  @@map("products")
}

model CostParameter {
  id                Int      @id @default(autoincrement())
  userId            Int      @map("user_id")
  parameterName     String   @map("parameter_name")
  parameterCategory String?  @map("parameter_category")
  parameterValue    Decimal  @db.Decimal(10, 4) @map("parameter_value")
  valueType         String?  @map("value_type")
  description       String?
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@map("cost_parameters")
}

model FinancialScenario {
  id                   Int      @id @default(autoincrement())
  userId               Int      @map("user_id")
  scenarioName         String?  @map("scenario_name")
  scenarioType         String?  @map("scenario_type")
  liveClassCount       Int?     @map("live_class_count")
  liveStudentsPerClass Int?     @map("live_students_per_class")
  livePricePerHour     Decimal? @db.Decimal(10, 2) @map("live_price_per_hour")
  liveHoursPerWeek     Int?     @map("live_hours_per_week")
  liveCommissionRate   Decimal? @db.Decimal(5, 4) @map("live_commission_rate")
  campProductId        Int?     @map("camp_product_id")
  campStudentCount     Int?     @map("camp_student_count")
  campSalesRate        Decimal? @db.Decimal(5, 4) @map("camp_sales_rate")
  campOpsRate          Decimal? @db.Decimal(5, 4) @map("camp_ops_rate")
  campMaterialCost     Decimal? @db.Decimal(10, 2) @map("camp_material_cost")
  totalRevenue         Decimal? @db.Decimal(12, 2) @map("total_revenue")
  totalCost            Decimal? @db.Decimal(12, 2) @map("total_cost")
  netProfit            Decimal? @db.Decimal(12, 2) @map("net_profit")
  profitMargin         Decimal? @db.Decimal(5, 4) @map("profit_margin")
  isDefault            Boolean  @default(false) @map("is_default")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  user        User     @relation(fields: [userId], references: [id])
  campProduct Product? @relation(fields: [campProductId], references: [id])

  @@map("financial_scenarios")
}

model Goal {
  id           Int       @id @default(autoincrement())
  userId       Int       @map("user_id")
  goalType     String?   @map("goal_type")
  goalName     String    @map("goal_name")
  targetValue  Decimal?  @db.Decimal(12, 2) @map("target_value")
  currentValue Decimal?  @default(0) @db.Decimal(12, 2) @map("current_value")
  unit         String?
  deadline     DateTime? @db.Date
  period       String?
  status       String?   @default("active")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@map("goals")
}

model WeeklyTracking {
  id                   Int      @id @default(autoincrement())
  userId               Int      @map("user_id")
  weekStart            DateTime @db.Date @map("week_start")
  weekEnd              DateTime @db.Date @map("week_end")
  xhsPostsTarget       Int?     @map("xhs_posts_target")
  xhsPostsActual       Int?     @map("xhs_posts_actual")
  newFollowersTarget   Int?     @map("new_followers_target")
  newFollowersActual   Int?     @map("new_followers_actual")
  inquiriesTarget      Int?     @map("inquiries_target")
  inquiriesActual      Int?     @map("inquiries_actual")
  trialStudentsTarget  Int?     @map("trial_students_target")
  trialStudentsActual  Int?     @map("trial_students_actual")
  newEnrollmentsTarget Int?     @map("new_enrollments_target")
  newEnrollmentsActual Int?     @map("new_enrollments_actual")
  revenueTarget        Decimal? @db.Decimal(12, 2) @map("revenue_target")
  revenueActual        Decimal? @db.Decimal(12, 2) @map("revenue_actual")
  wins                 String?
  challenges           String?
  nextWeekPriorities   String?  @map("next_week_priorities")
  onMainline           String?  @map("on_mainline")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@map("weekly_tracking")
}

model MonthlyReview {
  id                     Int      @id @default(autoincrement())
  userId                 Int      @map("user_id")
  month                  DateTime @db.Date
  keyActionsCompletion   String?  @map("key_actions_completion")
  biggestWin             String?  @map("biggest_win")
  biggestLesson          String?  @map("biggest_lesson")
  mainlineAdjustment     String?  @map("mainline_adjustment")
  adjustmentDetails      String?  @map("adjustment_details")
  nextMonthFocus         String?  @map("next_month_focus")
  createdAt              DateTime @default(now()) @map("created_at")
  updatedAt              DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@map("monthly_reviews")
}

model AiAutomation {
  id             Int      @id @default(autoincrement())
  userId         Int      @map("user_id")
  taskName       String   @map("task_name")
  description    String?
  toolSuggestion String?  @map("tool_suggestion")
  priority       Int?
  status         String?  @default("pending")
  notes          String?
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@map("ai_automations")
}

model FunnelMetric {
  id                 Int      @id @default(autoincrement())
  userId             Int      @map("user_id")
  recordDate         DateTime @db.Date @map("record_date")
  stage1Awareness    Int?     @map("stage1_awareness")
  stage2Interest     Int?     @map("stage2_interest")
  stage3Consideration Int?    @map("stage3_consideration")
  stage4Purchase     Int?     @map("stage4_purchase")
  stage5Retention    Int?     @map("stage5_retention")
  createdAt          DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("funnel_metrics")
}

model Student {
  id              Int      @id @default(autoincrement())
  userId          Int      @map("user_id")
  name            String?
  parentContact   String?  @map("parent_contact")
  source          String?
  currentStage    String?  @map("current_stage")
  enrolledProducts String? @map("enrolled_products")
  totalPaid       Decimal? @default(0) @db.Decimal(12, 2) @map("total_paid")
  notes           String?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@map("students")
}
```

---

## API 设计

### RESTful API 端点

```yaml
# 认证
POST   /api/auth/register     # 注册
POST   /api/auth/login        # 登录
POST   /api/auth/logout       # 登出
GET    /api/auth/me           # 获取当前用户

# 战略定位
GET    /api/strategic         # 获取战略定位
PUT    /api/strategic         # 更新战略定位

# 产品管理
GET    /api/products          # 获取所有产品
POST   /api/products          # 创建产品
PUT    /api/products/:id      # 更新产品
DELETE /api/products/:id      # 删除产品

# 成本参数
GET    /api/cost-parameters   # 获取所有成本参数
PUT    /api/cost-parameters/:id # 更新成本参数

# 财务计算
GET    /api/scenarios         # 获取所有财务场景
POST   /api/scenarios         # 保存财务场景
PUT    /api/scenarios/:id     # 更新财务场景
DELETE /api/scenarios/:id     # 删除财务场景
POST   /api/scenarios/calculate # 计算财务结果(不保存)

# 目标管理
GET    /api/goals             # 获取所有目标
POST   /api/goals             # 创建目标
PUT    /api/goals/:id         # 更新目标
DELETE /api/goals/:id         # 删除目标

# 周跟踪
GET    /api/weekly            # 获取周跟踪列表
GET    /api/weekly/current    # 获取当前周
POST   /api/weekly            # 创建周记录
PUT    /api/weekly/:id        # 更新周记录

# 月度复盘
GET    /api/monthly           # 获取月度复盘列表
GET    /api/monthly/current   # 获取当前月
POST   /api/monthly           # 创建月度复盘
PUT    /api/monthly/:id       # 更新月度复盘

# AI自动化
GET    /api/ai-automations    # 获取AI任务列表
POST   /api/ai-automations    # 创建AI任务
PUT    /api/ai-automations/:id # 更新AI任务状态

# 漏斗数据
GET    /api/funnel            # 获取漏斗数据
POST   /api/funnel            # 记录漏斗数据

# 学生管理 (可选)
GET    /api/students          # 获取学生列表
POST   /api/students          # 添加学生
PUT    /api/students/:id      # 更新学生信息

# 数据导出
GET    /api/export/weekly     # 导出周报表
GET    /api/export/monthly    # 导出月报表
GET    /api/export/financial  # 导出财务报表
```

---

## 前端页面结构

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 首页/仪表盘概览
│   ├── login/page.tsx           # 登录页
│   ├── strategic/page.tsx       # 战略定位页
│   ├── products/page.tsx        # 产品矩阵页
│   ├── calculator/page.tsx      # 财务计算器页
│   ├── funnel/page.tsx          # 用户旅程页
│   ├── ai/page.tsx              # AI自动化页
│   ├── tracker/page.tsx         # 执行跟踪页
│   │   ├── weekly/page.tsx      # 周跟踪
│   │   └── monthly/page.tsx     # 月度复盘
│   └── settings/page.tsx        # 设置页(成本参数等)
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── dashboard/
│   │   ├── KPICard.tsx
│   │   ├── PhaseIndicator.tsx
│   │   └── QuickActions.tsx
│   ├── products/
│   │   ├── ProductTable.tsx
│   │   ├── ProductForm.tsx
│   │   └── PricingTier.tsx
│   ├── calculator/
│   │   ├── LiveCourseCalculator.tsx
│   │   ├── RecordedCampCalculator.tsx
│   │   ├── ParameterSlider.tsx
│   │   └── ResultsSummary.tsx
│   ├── tracker/
│   │   ├── WeeklyForm.tsx
│   │   ├── MetricsTable.tsx
│   │   ├── ProgressBar.tsx
│   │   └── ReflectionForm.tsx
│   └── charts/
│       ├── FunnelChart.tsx
│       ├── RevenueChart.tsx
│       └── ProgressChart.tsx
├── lib/
│   ├── prisma.ts                # Prisma 客户端
│   ├── auth.ts                  # 认证逻辑
│   └── calculations.ts          # 财务计算函数
├── hooks/
│   ├── useProducts.ts
│   ├── useCalculator.ts
│   └── useTracking.ts
└── types/
    └── index.ts                 # TypeScript 类型定义
```

---

## 核心功能详细说明

### 1. 财务计算器 (最重要)

#### 直播课计算逻辑
```typescript
interface LiveCourseParams {
  classCount: number;        // 班级数量
  studentsPerClass: number;  // 每班学生数
  pricePerHour: number;      // 单价/人/小时
  hoursPerWeek: number;      // 每周课时
  commissionRate: number;    // 你的分成比例 (默认0.3)
}

function calculateLiveCourse(params: LiveCourseParams) {
  const weeklyRevenue = params.classCount * params.studentsPerClass * 
                        params.pricePerHour * params.hoursPerWeek;
  const weeklyIncome = weeklyRevenue * params.commissionRate;
  const monthlyRevenue = weeklyRevenue * 4;
  const monthlyIncome = weeklyIncome * 4;
  
  return { weeklyRevenue, weeklyIncome, monthlyRevenue, monthlyIncome };
}
```

#### 录播营计算逻辑
```typescript
interface RecordedCampParams {
  productPrice: number;      // 产品单价
  studentCount: number;      // 学生人数
  salesRate: number;         // 销售分成比例
  opsRate: number;           // 运营分成比例
  materialCost: number;      // 教材成本/人
  hasLiveService: boolean;   // 是否带直播
}

function calculateRecordedCamp(params: RecordedCampParams) {
  const totalRevenue = params.productPrice * params.studentCount;
  const salesCost = totalRevenue * params.salesRate;
  const afterSales = totalRevenue - salesCost;
  const opsCost = afterSales * params.opsRate;
  const materialCost = params.materialCost * params.studentCount;
  const netProfit = afterSales - opsCost - materialCost;
  const profitMargin = netProfit / totalRevenue;
  
  return { totalRevenue, salesCost, opsCost, materialCost, netProfit, profitMargin };
}
```

### 2. 产品矩阵管理

支持的产品类型：
- **直播课**: KET, PET, 小托福, FCE, 托福, SSAT(外包), SAT(外包)
- **录播营**: 全程营(带/不带直播), 考冲营(带/不带直播), 教材部分

### 3. 周跟踪指标

| 指标 | 默认目标 | 说明 |
|------|---------|------|
| 小红书发布 | 4条/周 | 周一三五日各1条 |
| 新增粉丝 | 50/周 | 累计增长 |
| 私信咨询 | 10/周 | 包括评论转私信 |
| 试听学生 | 5/周 | 参加试听课的学生 |
| 新入班学生 | 3/周 | 实际付费入班 |
| 本周收入 | 10000元 | 直播+录播总收入 |

---

## 开发步骤建议

### Phase 1: MVP (1-2周)
1. 搭建 Next.js 项目 + Tailwind CSS
2. 实现财务计算器页面 (核心功能)
3. 本地 SQLite 数据库 + Prisma
4. 保存/读取计算场景

### Phase 2: 完善 (1-2周)
5. 产品矩阵管理
6. 周跟踪表单
7. 月度复盘
8. 数据可视化图表

### Phase 3: 增强 (1周)
9. 用户认证 (如果需要多设备同步)
10. 数据导出 (Excel/PDF)
11. 部署上线

---

## 给 AI 编程助手的提示词

复制以下内容给 Cursor/Copilot：

```
我需要开发一个名为 "Vico Strategic Dashboard" 的个人战略规划应用。

技术栈：Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + SQLite

核心功能：
1. 财务计算器 - 动态计算直播课和录播营收入，支持参数调整
2. 产品矩阵管理 - 管理不同考试类型(KET/PET/FCE/托福等)的课程产品和定价
3. 周执行跟踪 - 记录每周指标(小红书发布、粉丝、咨询、入班等)和复盘
4. 战略定位 - 记录三维分析和战略方向

请先帮我：
1. 初始化 Next.js 项目
2. 配置 Prisma + SQLite
3. 创建数据库 schema
4. 实现财务计算器页面，包含直播课和录播营两个计算模块

财务计算公式：
- 直播课周收入 = 班级数 × 每班学生 × 单价 × 周课时
- 直播课我的收入 = 周收入 × 我的分成比例(默认30%)
- 录播营利润 = 总流水 - 销售成本(25-40%) - 运营成本(65-70%) - 教材成本

参考现有 HTML 文件中的 UI 设计和交互逻辑。
```

---

## 附录：默认数据

### 产品默认数据
```json
[
  {"category": "live_course", "examType": "KET", "productType": "small_class", "price": 350, "isOutsourced": false},
  {"category": "live_course", "examType": "PET", "productType": "small_class", "price": 400, "isOutsourced": false},
  {"category": "live_course", "examType": "TOEFL_Junior", "productType": "small_class", "price": 450, "isOutsourced": false},
  {"category": "live_course", "examType": "FCE", "productType": "small_class", "price": 500, "isOutsourced": false},
  {"category": "live_course", "examType": "TOEFL", "productType": "small_class", "price": 550, "isOutsourced": false},
  {"category": "live_course", "examType": "SSAT", "productType": "small_class", "price": 600, "isOutsourced": true},
  {"category": "live_course", "examType": "SAT", "productType": "small_class", "price": 650, "isOutsourced": true},
  {"category": "recorded_camp", "examType": "KET", "productType": "full", "hasLiveService": true, "price": 7800},
  {"category": "recorded_camp", "examType": "KET", "productType": "sprint", "hasLiveService": true, "price": 4800},
  {"category": "recorded_camp", "examType": "PET", "productType": "full", "hasLiveService": true, "price": 8800},
  {"category": "recorded_camp", "examType": "FCE", "productType": "full", "hasLiveService": true, "price": 12800}
]
```

---

**文档版本**: v1.0  
**最后更新**: 2024年12月  
**作者**: Claude (AI Assistant)
