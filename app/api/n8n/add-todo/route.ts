import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { title, user_email, enhance = true } = await request.json()

    if (!title || !user_email) {
      return NextResponse.json(
        { error: 'title and user_email are required' },
        { status: 400 }
      )
    }

    let finalTitle = title.trim()
    let enhancementInfo = null

    // Enhance title with AI if requested
    if (enhance) {
      try {
        const enhanceResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/enhance-title`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: finalTitle }),
        })

        if (enhanceResponse.ok) {
          const enhanceData = await enhanceResponse.json()
          finalTitle = enhanceData.enhanced_title
          enhancementInfo = {
            original_title: enhanceData.original_title,
            enhanced_title: enhanceData.enhanced_title,
            improvements: enhanceData.improvements
          }
        }
      } catch (enhanceError) {
        console.warn('Failed to enhance title, using original:', enhanceError)
      }
    }

    // Create the todo in Supabase
    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          title: finalTitle,
          completed: false,
          user_email
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      todo: data[0],
      enhancement: enhancementInfo,
      message: `Todo "${finalTitle}" created successfully for ${user_email}`,
      n8n_response: {
        status: 'created',
        id: data[0].id,
        title: finalTitle,
        user: user_email,
        enhanced: enhance && enhancementInfo !== null
      }
    })
  } catch (error) {
    console.error('Error in N8N add-todo endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create todo',
        details: error instanceof Error ? error.message : 'Unknown error',
        n8n_response: {
          status: 'error',
          message: 'Could not create todo'
        }
      },
      { status: 500 }
    )
  }
}