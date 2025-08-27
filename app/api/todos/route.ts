import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('user_email')

    if (!userEmail) {
      return NextResponse.json(
        { error: 'user_email is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ todos: data })
  } catch (error) {
    console.error('Error fetching todos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, user_email, completed = false } = await request.json()

    if (!title || !user_email) {
      return NextResponse.json(
        { error: 'title and user_email are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          title: title.trim(),
          completed,
          user_email
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      todo: data[0],
      message: 'Todo created successfully' 
    })
  } catch (error) {
    console.error('Error creating todo:', error)
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    )
  }
}