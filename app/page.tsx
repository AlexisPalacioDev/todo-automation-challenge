'use client'

import { useState, useEffect } from 'react'
import { supabase, Todo } from '@/lib/supabase'
import { PlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import TaskCard from '@/components/TaskCard'
import Tutorial from '@/components/Tutorial'
import UserSetup from '@/components/UserSetup'

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTestMode, setIsTestMode] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showN8NCard, setShowN8NCard] = useState(false)
  const [swipedTodos, setSwipedTodos] = useState<{[key: string]: number}>({}) // Store swipe positions
  const [deletingTodos, setDeletingTodos] = useState<Set<number>>(new Set()) // Track deleting todos
  const [isDragging, setIsDragging] = useState<number | null>(null) // Track mouse dragging
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)
  const [showUserSetup, setShowUserSetup] = useState(false)
  const [userSetupMode, setUserSetupMode] = useState<'first-time' | 'change-user'>('first-time')
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [typingAnimation, setTypingAnimation] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Generate demo tasks based on tutorial step
  const getDemoTasks = () => {
    if (tutorialStep === 1) { // Create Smart Tasks step
      return [
        {
          id: -1,
          title: "🔄 AI Enhanced: Buy groceries - milk, bread, eggs, organize by store layout, check weekly meal plan",
          completed: false,
          created_at: new Date().toISOString(),
          user_email: 'demo'
        },
        {
          id: -2,
          title: "💡 Original: buy groceries",
          completed: true,
          created_at: new Date(Date.now() - 1000).toISOString(),
          user_email: 'demo'
        }
      ]
    } else if (tutorialStep === 2 || tutorialStep === 3) { // Swipe gestures steps
      return [
        {
          id: -1,
          title: "Try swiping right to complete this task! →",
          completed: false,
          created_at: new Date().toISOString(),
          user_email: 'demo'
        },
        {
          id: -2,
          title: "← Try swiping left to delete this task",
          completed: false,
          created_at: new Date().toISOString(),
          user_email: 'demo'
        }
      ]
    } else { // Default
      return [
        {
          id: -1,
          title: "Welcome to TaskForge AI! Your smart task companion 🚀",
          completed: false,
          created_at: new Date().toISOString(),
          user_email: 'demo'
        }
      ]
    }
  }

  const demoTasks = getDemoTasks()
  
  // Debug logging for tutorial
  if (showTutorial) {
    console.log('Tutorial Step:', tutorialStep, 'Demo Tasks:', demoTasks)
  }

  // Validar email con expresión regular
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Obtener la URL del webhook según el modo
  const getWebhookUrl = () => {
    if (customUrl) {
      return customUrl
    }
    return isTestMode 
      ? 'https://n8n-n8n.lehnwx.easypanel.host/webhook-test/todo-webhook'
      : 'https://n8n-n8n.lehnwx.easypanel.host/webhook/todo-webhook'
  }


  // Typing animation effect for tutorial
  useEffect(() => {
    if (showTutorial && tutorialStep === 1) {
      // Start typing animation for "Create Smart Tasks" step
      const textToType = "buy eggs"
      let currentIndex = 0
      setTypingAnimation('')
      setIsTyping(true)
      
      const startTyping = () => {
        const typingInterval = setInterval(() => {
          if (currentIndex <= textToType.length) {
            setTypingAnimation(textToType.slice(0, currentIndex))
            currentIndex++
          } else {
            clearInterval(typingInterval)
            // After finishing typing, pause and then clear
            setTimeout(() => {
              setTypingAnimation('')
              currentIndex = 0
              // Restart the animation after a pause
              setTimeout(() => {
                startTyping() // Recursive call to restart animation
              }, 1000)
            }, 2500)
          }
        }, 300) // Slower typing for better visibility
      }
      
      startTyping()
      
      // Cleanup function
      return () => {
        setTypingAnimation('')
        setIsTyping(false)
      }
    } else {
      setTypingAnimation('')
      setIsTyping(false)
    }
  }, [showTutorial, tutorialStep])
  useEffect(() => {
    const email = localStorage.getItem('userEmail')
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial')
    
    if (email && isValidEmail(email)) {
      setUserEmail(email)
      loadTodos(email)
      // Check if user has seen tutorial
      if (!hasSeenTutorial) {
        setIsFirstTimeUser(true)
      }
    } else {
      // Show user setup form instead of prompt
      setUserSetupMode('first-time')
      setShowUserSetup(true)
    }
  }, [])

  // Theme management - Default to light mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const shouldBeDark = savedTheme === 'dark'
    
    setIsDarkMode(shouldBeDark)
    document.documentElement.classList.toggle('dark', shouldBeDark)
  }, [])

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newDarkMode)
  }

  const loadTodos = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      const todosData = data || []
      console.log('Todos loaded from Supabase:', todosData)
      setTodos(todosData)
    } catch (error) {
      console.error('Error loading todos:', error)
      // No mostrar alert si es error de conexión inicial
      setTodos([]) // Set empty array como fallback
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || !userEmail || !isValidEmail(userEmail)) {
      if (!isValidEmail(userEmail)) {
        alert('Por favor configura un email válido antes de crear tareas')
      }
      return
    }

    setLoading(true)
    try {
      const webhookUrl = getWebhookUrl()
      
      // Usar N8N workflow para procesar y crear la tarea
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            text: newTodo.trim()
          },
          user_email: userEmail
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Todo created via N8N:', result)
        
        // Recargar todos desde Supabase para ver la nueva tarea
        await loadTodos(userEmail)
        setNewTodo('')
      } else {
        throw new Error(`Error en N8N workflow (${isTestMode ? 'Test' : 'Producción'})`)
      }
    } catch (error) {
      console.error('Error adding todo via N8N:', error)
      alert(`Error al agregar la tarea en modo ${isTestMode ? 'Test' : 'Producción'}`)
    }
    setLoading(false)
  }

  const toggleComplete = async (id: number, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)

      if (error) throw error

      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    } catch (error) {
      console.error('Error updating todo:', error)
      alert('Error al actualizar la tarea')
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTodos(todos.filter(todo => todo.id !== id))
    } catch (error) {
      console.error('Error deleting todo:', error)
      alert('Error al eliminar la tarea')
    }
  }

  const saveEdit = async (id: number, title: string) => {
    if (!title.trim()) return

    try {
      const { error } = await supabase
        .from('todos')
        .update({ title: title.trim() })
        .eq('id', id)

      if (error) throw error

      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, title: title.trim() } : todo
      ))
    } catch (error) {
      console.error('Error updating todo:', error)
      alert('Error al actualizar la tarea')
    }
  }

  // Swipe to delete functionality
  const handleTouchStart = (e: React.TouchEvent, todoId: number) => {
    const touch = e.touches[0]
    setSwipedTodos(prev => ({
      ...prev,
      [`${todoId}_startX`]: touch.clientX,
      [todoId]: 0
    }))
  }

  const handleTouchMove = (e: React.TouchEvent, todoId: number) => {
    const touch = e.touches[0]
    const startX = swipedTodos[`${todoId}_startX`]
    if (startX === undefined) return

    const deltaX = touch.clientX - startX
    const leftSwipeThreshold = -120 // Maximum left swipe distance
    const rightSwipeThreshold = 120 // Maximum right swipe distance

    // Haptic feedback at key thresholds
    const previousDelta = swipedTodos[todoId] || 0
    if ((Math.abs(deltaX) > 40 && Math.abs(previousDelta) <= 40) ||
        (Math.abs(deltaX) > 70 && Math.abs(previousDelta) <= 70)) {
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50) // Short vibration
      }
    }

    // Allow both left and right swipe
    if (deltaX < 0) {
      // Left swipe for delete
      const clampedDelta = Math.max(deltaX, leftSwipeThreshold)
      setSwipedTodos(prev => ({
        ...prev,
        [todoId]: clampedDelta
      }))
    } else if (deltaX > 0) {
      // Right swipe for complete
      const clampedDelta = Math.min(deltaX, rightSwipeThreshold)
      setSwipedTodos(prev => ({
        ...prev,
        [todoId]: clampedDelta
      }))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, todoId: number) => {
    const deltaX = swipedTodos[todoId] || 0
    const deleteThreshold = -80 // Threshold to trigger delete
    const completeThreshold = 80 // Threshold to trigger complete

    if (deltaX < deleteThreshold) {
      // Trigger delete with animation
      handleSwipeDelete(todoId)
    } else if (deltaX > completeThreshold) {
      // Trigger complete/uncomplete
      handleSwipeComplete(todoId)
    } else {
      // Reset position with smooth transition
      setSwipedTodos(prev => {
        const newState = { ...prev }
        delete newState[todoId]
        delete newState[`${todoId}_startX`]
        return newState
      })
    }
  }

  const handleSwipeComplete = async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    // Success haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]) // Success pattern
    }

    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', id)

      if (error) throw error

      setTodos(todos.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      ))

      // Reset swipe position with a slight delay for visual feedback
      setTimeout(() => {
        setSwipedTodos(prev => {
          const newState = { ...prev }
          delete newState[id]
          delete newState[`${id}_startX`]
          return newState
        })
      }, 200)

    } catch (error) {
      console.error('Error updating todo:', error)
      // Error haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]) // Error pattern
      }
      alert('Error al actualizar la tarea')
      // Reset swipe position on error
      setSwipedTodos(prev => {
        const newState = { ...prev }
        delete newState[id]
        delete newState[`${id}_startX`]
        return newState
      })
    }
  }

  const handleSwipeDelete = async (id: number) => {
    // Add to deleting set for animation
    setDeletingTodos(prev => new Set([...prev, id]))
    
    // Delete haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([150, 50, 150]) // Delete pattern
    }
    
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Wait for delete animation to complete
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Remove from todos list
      setTodos(prev => prev.filter(todo => todo.id !== id))
      
    } catch (error) {
      console.error('Error deleting todo:', error)
      // Error haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]) // Error pattern
      }
      alert('Error al eliminar la tarea')
    } finally {
      // Clean up state regardless of success/failure
      setSwipedTodos(prev => {
        const newState = { ...prev }
        delete newState[id]
        delete newState[`${id}_startX`]
        return newState
      })
      setDeletingTodos(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  // Mouse drag support for desktop
  const handleMouseDown = (e: React.MouseEvent, todoId: number) => {
    e.preventDefault()
    setIsDragging(todoId)
    setSwipedTodos(prev => ({
      ...prev,
      [`${todoId}_startX`]: e.clientX,
      [todoId]: 0
    }))
  }

  const handleMouseMove = (e: React.MouseEvent, todoId: number) => {
    if (isDragging !== todoId) return
    
    const startX = swipedTodos[`${todoId}_startX`]
    if (startX === undefined) return

    const deltaX = e.clientX - startX
    const leftSwipeThreshold = -120
    const rightSwipeThreshold = 120

    // Allow both left and right drag
    if (deltaX < 0) {
      // Left drag for delete
      const clampedDelta = Math.max(deltaX, leftSwipeThreshold)
      setSwipedTodos(prev => ({
        ...prev,
        [todoId]: clampedDelta
      }))
    } else if (deltaX > 0) {
      // Right drag for complete
      const clampedDelta = Math.min(deltaX, rightSwipeThreshold)
      setSwipedTodos(prev => ({
        ...prev,
        [todoId]: clampedDelta
      }))
    }
  }

  const handleMouseUp = (e: React.MouseEvent, todoId: number) => {
    if (isDragging !== todoId) return
    
    setIsDragging(null)
    const deltaX = swipedTodos[todoId] || 0
    const deleteThreshold = -80
    const completeThreshold = 80

    if (deltaX < deleteThreshold) {
      handleSwipeDelete(todoId)
    } else if (deltaX > completeThreshold) {
      handleSwipeComplete(todoId)
    } else {
      setSwipedTodos(prev => {
        const newState = { ...prev }
        delete newState[todoId]
        delete newState[`${todoId}_startX`]
        return newState
      })
    }
  }

  const changeUser = () => {
    setUserSetupMode('change-user')
    setShowUserSetup(true)
  }

  const handleTutorialComplete = () => {
    localStorage.setItem('hasSeenTutorial', 'true')
    setIsFirstTimeUser(false)
    setShowTutorial(false)
  }

  const startTutorial = () => {
    setShowTutorial(true)
    setIsFirstTimeUser(true)
  }

  const handleUserSetup = (email: string) => {
    if (userSetupMode === 'change-user') {
      localStorage.removeItem('userEmail')
    }
    
    setUserEmail(email)
    localStorage.setItem('userEmail', email)
    loadTodos(email)
    setShowUserSetup(false)
    
    // If first time user, show tutorial
    if (userSetupMode === 'first-time') {
      setShowTutorial(true)
      setIsFirstTimeUser(true)
    }
  }

  const handleUserSetupCancel = () => {
    if (userSetupMode === 'change-user') {
      setShowUserSetup(false)
    }
    // For first-time users, we don't allow cancel
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div id="header" className="text-center mb-8">
          <div className="neu-card p-8">
            <h1 className="text-4xl font-bold mb-2 text-display text-primary">
              TaskForge AI
            </h1>
            <p className="text-sm text-secondary mb-4 opacity-80">
              Forge smarter tasks with artificial intelligence
            </p>
            <div className="neu-card-inset p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">
                    User: 
                    <span className={`font-medium ml-1 ${isValidEmail(userEmail) ? 'text-green-500' : 'text-red-500'}`}>
                      {userEmail}
                      {isValidEmail(userEmail) ? ' ✓' : ' ⚠️'}
                    </span>
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {/* N8N Settings Toggle */}
                  <button
                    id="settings-button"
                    onClick={() => setShowN8NCard(!showN8NCard)}
                    className="neu-button p-2"
                    title={showN8NCard ? 'Hide N8N settings' : 'Show N8N settings'}
                  >
                    <svg className="w-5 h-5" style={{ color: 'var(--foreground)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="neu-button p-2"
                    title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDarkMode ? (
                      <svg className="w-5 h-5" style={{ color: 'var(--foreground)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" style={{ color: 'var(--foreground)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* N8N Controls */}
        {showN8NCard && (
          <div className="mb-6 slide-down">
            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold card-title">N8N Configuration</h3>
                <button
                  onClick={() => setShowN8NCard(false)}
                  className="neu-button p-2 text-gray-500 hover:text-red-500"
                  title="Close N8N settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                {/* User Configuration */}
                <div className="neu-card-inset p-3">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="text-sm">
                      <span className="text-secondary">Current User: </span>
                      <span className={`font-medium ml-1 ${isValidEmail(userEmail) ? 'text-green-500' : 'text-red-500'}`}>
                        {userEmail}
                        {isValidEmail(userEmail) ? ' ✓' : ' ⚠️'}
                      </span>
                    </div>
                    <button 
                      onClick={changeUser}
                      className="neu-button px-3 py-2 text-sm"
                      style={{ color: 'var(--primary)' }}
                    >
                      Change User
                    </button>
                  </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-secondary">N8N Mode:</span>
                    <button
                      onClick={() => setIsTestMode(!isTestMode)}
                      className={`neu-button px-4 py-2 font-medium ${
                        isTestMode 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                      }`}
                    >
                      {isTestMode ? 'Test Mode' : 'Production'}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="neu-button px-3 py-2 text-sm"
                    style={{ color: 'var(--primary)' }}
                  >
                    {showUrlInput ? 'Hide URL' : 'Custom URL'}
                  </button>
                </div>

                {/* Current URL Display */}
                <div className="neu-card-inset p-3">
                  <div className="text-sm">
                    <span className="text-secondary">Current URL: </span>
                    <code className="text-green-600 neu-card-inset px-2 py-1 text-xs font-mono break-all">
                      {getWebhookUrl()}
                    </code>
                  </div>
                </div>

                {/* Custom URL Input */}
                {showUrlInput && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://your-n8n.com/webhook/todo-webhook"
                      className="flex-1 neu-input px-4 py-3 text-sm text-primary"
                    />
                    <button
                      onClick={() => setCustomUrl('')}
                      className="neu-button px-4 py-3 text-red-500 hover:text-red-600"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="mb-8">
          <div className="neu-card p-6">
            {/* Tutorial Demo Box for Create Smart Tasks */}
            {showTutorial && tutorialStep === 1 && (
              <div className="mb-4 neu-card-inset p-4 rounded-lg">
                <div className="text-center mb-3">
                  <h4 className="text-sm font-semibold text-primary mb-1">
                    🤖 AI Enhancement Demo
                  </h4>
                  <p className="text-xs text-secondary">
                    Watch how AI transforms simple tasks into detailed, actionable items
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="neu-card-inset p-3 rounded">
                    <div className="text-xs text-tertiary mb-1">Before (Your Input):</div>
                    <div className="text-primary font-mono">"buy eggs"</div>
                  </div>
                  <div className="neu-card-inset p-3 rounded">
                    <div className="text-xs text-tertiary mb-1">After (AI Enhanced):</div>
                    <div className="text-primary text-xs leading-relaxed">
                      "🥚 Buy eggs - organic free-range, check expiration dates, 
                      compare prices, add to weekly meal planning list"
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-4 flex-col sm:flex-row">
              <input
                id="task-input"
                type="text"
                value={showTutorial && tutorialStep === 1 ? typingAnimation : newTodo}
                onChange={(e) => {
                  if (!showTutorial || tutorialStep !== 1) {
                    setNewTodo(e.target.value)
                  }
                }}
                placeholder={showTutorial && tutorialStep === 1 ? "Watch AI enhance your tasks..." : "What needs to be done? AI will enhance it ✨"}
                className={`flex-1 neu-input px-4 py-4 text-base ${
                  showTutorial && tutorialStep === 1 
                    ? 'typing-demo tutorial-demo-highlight' + (isTyping ? ' typing-cursor' : '') 
                    : ''
                }`}
                style={{ color: 'var(--foreground)' }}
                disabled={loading || (showTutorial && tutorialStep === 1)}
                readOnly={showTutorial && tutorialStep === 1}
              />
              <button
                type="submit"
                disabled={loading || !newTodo.trim()}
                className={`neu-button px-6 py-4 font-medium flex items-center gap-2 justify-center min-w-[200px] ${
                  loading || !newTodo.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ color: 'var(--primary)' }}
              >
                <PlusIcon className="w-5 h-5" />
                {loading ? 'Forging...' : `Forge with AI ${isTestMode ? '(Test)' : '(Live)'}`}
              </button>
            </div>
          </div>
        </form>

        {/* Todo List */}
        <div id="task-list" className="space-y-4">
          {(showTutorial ? demoTasks : todos).length === 0 ? (
            <div className="neu-card p-12 text-center">
              <div className="neu-pulse">
                <div className="w-16 h-16 mx-auto mb-4 neu-card-inset rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 opacity-40" style={{ color: 'var(--foreground)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2 text-primary">No tasks forged yet</p>
                <p className="text-sm text-secondary">Create your first AI-enhanced task</p>
              </div>
            </div>
          ) : (
            (showTutorial ? demoTasks : todos).map((todo) => (
              <TaskCard
                key={todo.id}
                todo={todo}
                onToggleComplete={showTutorial ? () => {} : toggleComplete}
                onEdit={showTutorial ? () => {} : saveEdit}
                onDelete={showTutorial ? () => {} : deleteTodo}
                editingId={editingId}
                editingText={editingText}
                setEditingId={setEditingId}
                setEditingText={setEditingText}
                swipePosition={swipedTodos[todo.id] || 0}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                isDeleting={deletingTodos.has(todo.id)}
              />
            ))
          )}
        </div>

        {/* Stats */}
        {(showTutorial || todos.length > 0) && (
          <div id="stats-section" className="mt-8">
            <div className="neu-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-center card-title">Statistics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="neu-card-inset p-4">
                  <div className="text-3xl font-bold mb-2" style={{ color: 'var(--primary)' }}>
                    {showTutorial ? 2 : todos.length}
                  </div>
                  <div className="text-sm text-tertiary">Total</div>
                </div>
                <div className="neu-card-inset p-4">
                  <div className="text-3xl font-bold text-green-500 mb-2">
                    {showTutorial ? 0 : todos.filter(t => t.completed).length}
                  </div>
                  <div className="text-sm text-tertiary">Completed</div>
                </div>
                <div className="neu-card-inset p-4">
                  <div className="text-3xl font-bold text-orange-500 mb-2">
                    {showTutorial ? 2 : todos.filter(t => !t.completed).length}
                  </div>
                  <div className="text-sm text-tertiary">Pending</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* N8N Integration Info */}
        <div className="mt-8">
          <div className="neu-card p-6 text-center">
            <div className="neu-card-inset p-4">
              <div className="w-12 h-12 mx-auto mb-3 neu-card-inset rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 card-title">TaskForge Intelligence</h3>
              <p className="text-sm text-secondary mb-2">
                Your tasks are intelligently enhanced using AI workflows
              </p>
              <p className="text-xs text-tertiary">
                OpenAI • Telegram • WhatsApp • Supabase • N8N
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Help Button */}
      {!showTutorial && !showUserSetup && userEmail && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={startTutorial}
            className="neu-button p-4 rounded-full shadow-lg hover:scale-110 transition-all duration-200 tutorial-button-float"
            style={{ background: 'linear-gradient(145deg, var(--primary), var(--primary-dark))' }}
            title="Show tutorial"
          >
            <QuestionMarkCircleIcon className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {/* Tutorial Component */}
      {showTutorial && (
        <Tutorial 
          isFirstTime={isFirstTimeUser}
          onComplete={handleTutorialComplete}
          onStepChange={setTutorialStep}
        />
      )}

      {/* User Setup Component */}
      {showUserSetup && (
        <UserSetup
          isFirstTime={userSetupMode === 'first-time'}
          onEmailSubmit={handleUserSetup}
          onCancel={userSetupMode === 'change-user' ? handleUserSetupCancel : undefined}
        />
      )}
    </div>
  )
}
