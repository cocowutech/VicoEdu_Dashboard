import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 1

// GET - 获取所有设置
export async function GET() {
  try {
    const prisma = await getPrisma()
    const settings = await prisma.globalSetting.findMany({
      where: { userId: DEFAULT_USER_ID },
    })

    // 转换为键值对格式
    const settingsMap: Record<string, string | number | boolean> = {}
    for (const setting of settings) {
      if (setting.settingType === 'number') {
        settingsMap[setting.settingKey] = parseFloat(setting.settingValue)
      } else if (setting.settingType === 'boolean') {
        settingsMap[setting.settingKey] = setting.settingValue === 'true'
      } else {
        settingsMap[setting.settingKey] = setting.settingValue
      }
    }

    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST - 创建或更新设置
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()

    const setting = await prisma.globalSetting.upsert({
      where: {
        userId_settingKey: {
          userId: DEFAULT_USER_ID,
          settingKey: data.settingKey,
        },
      },
      update: {
        settingValue: String(data.settingValue),
        settingType: data.settingType || 'string',
        description: data.description || null,
      },
      create: {
        userId: DEFAULT_USER_ID,
        settingKey: data.settingKey,
        settingValue: String(data.settingValue),
        settingType: data.settingType || 'string',
        description: data.description || null,
      },
    })
    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error saving setting:', error)
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }
}

// PUT - 批量更新设置
export async function PUT(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const data = await request.json()
    const results = []

    for (const [key, value] of Object.entries(data)) {
      const settingType = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string'
      const setting = await prisma.globalSetting.upsert({
        where: {
          userId_settingKey: {
            userId: DEFAULT_USER_ID,
            settingKey: key,
          },
        },
        update: {
          settingValue: String(value),
          settingType,
        },
        create: {
          userId: DEFAULT_USER_ID,
          settingKey: key,
          settingValue: String(value),
          settingType,
        },
      })
      results.push(setting)
    }

    return NextResponse.json({ success: true, count: results.length })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

// DELETE - 删除设置
export async function DELETE(request: NextRequest) {
  try {
    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const settingKey = searchParams.get('key')

    if (!settingKey) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 })
    }

    await prisma.globalSetting.delete({
      where: {
        userId_settingKey: {
          userId: DEFAULT_USER_ID,
          settingKey,
        },
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting setting:', error)
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 })
  }
}
