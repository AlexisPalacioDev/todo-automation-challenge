import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      )
    }

    // Simulate AI enhancement with smart improvements
    const enhancedTitle = enhanceTitle(title)

    return NextResponse.json({
      original_title: title,
      enhanced_title: enhancedTitle,
      improvements: getImprovementDescription(title, enhancedTitle)
    })
  } catch (error) {
    console.error('Error enhancing title:', error)
    return NextResponse.json(
      { error: 'Failed to enhance title' },
      { status: 500 }
    )
  }
}

function enhanceTitle(title: string): string {
  const lowercaseTitle = title.toLowerCase().trim()
  
  // Patterns for common task types
  const patterns = [
    // Exercise/Fitness
    {
      keywords: ['gym', 'ejercicio', 'correr', 'caminar', 'entrenar', 'workout'],
      enhance: (t: string) => `🏋️‍♀️ ${capitalizeFirst(t)} - Duración: 30-45 min`
    },
    // Work/Professional
    {
      keywords: ['trabajo', 'reunión', 'meeting', 'presentación', 'proyecto', 'email'],
      enhance: (t: string) => `💼 ${capitalizeFirst(t)} - Prioridad: Media`
    },
    // Study/Learning
    {
      keywords: ['estudiar', 'leer', 'curso', 'aprender', 'book', 'tutorial'],
      enhance: (t: string) => `📚 ${capitalizeFirst(t)} - Meta: 1-2 horas`
    },
    // Health/Medical
    {
      keywords: ['doctor', 'médico', 'cita', 'medicina', 'salud'],
      enhance: (t: string) => `🏥 ${capitalizeFirst(t)} - Recordatorio: Confirmar`
    },
    // Shopping/Errands
    {
      keywords: ['comprar', 'mercado', 'shopping', 'farmacia', 'banco'],
      enhance: (t: string) => `🛒 ${capitalizeFirst(t)} - Lista: Preparar`
    },
    // Personal/Family
    {
      keywords: ['familia', 'friend', 'amigo', 'cumpleaños', 'llamar'],
      enhance: (t: string) => `👨‍👩‍👧‍👦 ${capitalizeFirst(t)} - Tiempo: Flexible`
    }
  ]

  // Check if title matches any pattern
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lowercaseTitle.includes(keyword))) {
      return pattern.enhance(title)
    }
  }

  // Generic enhancements based on structure
  if (lowercaseTitle.length < 10) {
    return `📋 ${capitalizeFirst(title)} - Detalles: Especificar más`
  }

  if (!title.includes('?') && isQuestion(lowercaseTitle)) {
    return `❓ ${capitalizeFirst(title)}?`
  }

  // Add time-based context
  const timeKeywords = ['mañana', 'tarde', 'noche', 'hoy', 'tomorrow', 'today']
  if (timeKeywords.some(keyword => lowercaseTitle.includes(keyword))) {
    return `⏰ ${capitalizeFirst(title)} - Recordatorio activado`
  }

  // Default enhancement
  return `✨ ${capitalizeFirst(title)} - Mejorado por IA`
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function isQuestion(title: string): boolean {
  const questionWords = ['qué', 'cómo', 'cuándo', 'dónde', 'por qué', 'quién', 'what', 'how', 'when', 'where', 'why', 'who']
  return questionWords.some(word => title.startsWith(word))
}

function getImprovementDescription(original: string, enhanced: string): string {
  if (enhanced.includes('🏋️‍♀️')) return 'Added fitness context and time estimation'
  if (enhanced.includes('💼')) return 'Added professional context and priority level'
  if (enhanced.includes('📚')) return 'Added learning context and time goal'
  if (enhanced.includes('🏥')) return 'Added health context and reminder'
  if (enhanced.includes('🛒')) return 'Added shopping context and preparation reminder'
  if (enhanced.includes('👨‍👩‍👧‍👦')) return 'Added personal/family context'
  if (enhanced.includes('📋')) return 'Suggested adding more details'
  if (enhanced.includes('❓')) return 'Formatted as question'
  if (enhanced.includes('⏰')) return 'Added time-based reminder'
  return 'Added AI enhancement with emoji and context'
}