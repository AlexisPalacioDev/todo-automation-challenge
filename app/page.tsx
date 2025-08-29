'use client'

import { useState, useEffect } from 'react'
import { supabase, Todo } from '@/lib/supabase'
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

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
  const [swipedTodos, setSwipedTodos] = useState<{[key: number]: number}>({}) // Store swipe positions
  const [deletingTodos, setDeletingTodos] = useState<Set<number>>(new Set()) // Track deleting todos
  const [isDragging, setIsDragging] = useState<number | null>(null) // Track mouse dragging

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


  // Load todos on component mount
  useEffect(() => {
    const email = localStorage.getItem('userEmail')
    if (email && isValidEmail(email)) {
      setUserEmail(email)
      loadTodos(email)
    } else {
      // Si no hay email o es inválido, pedirlo
      let userEmail = prompt('Por favor ingresa tu email para usar la app:')
      
      // Validar el email ingresado
      while (userEmail && !isValidEmail(userEmail)) {
        userEmail = prompt('Email inválido. Por favor ingresa un email válido (ejemplo: usuario@dominio.com):')
      }
      
      if (userEmail) {
        setUserEmail(userEmail)
        localStorage.setItem('userEmail', userEmail)
        loadTodos(userEmail)
      }
    }
  }, [])

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    
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

  const startEdit = (id: number, title: string) => {
    setEditingId(id)
    setEditingText(title)
  }

  const saveEdit = async (id: number) => {
    if (!editingText.trim()) return

    try {
      const { error } = await supabase
        .from('todos')
        .update({ title: editingText.trim() })
        .eq('id', id)

      if (error) throw error

      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, title: editingText.trim() } : todo
      ))
      setEditingId(null)
      setEditingText('')
    } catch (error) {
      console.error('Error updating todo:', error)
      alert('Error al actualizar la tarea')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText('')
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
    const swipeThreshold = -120 // Maximum swipe distance

    // Only allow left swipe (negative deltaX)
    if (deltaX < 0) {
      const clampedDelta = Math.max(deltaX, swipeThreshold)
      setSwipedTodos(prev => ({
        ...prev,
        [todoId]: clampedDelta
      }))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, todoId: number) => {
    const deltaX = swipedTodos[todoId] || 0
    const swipeThreshold = -80 // Threshold to trigger delete

    if (deltaX < swipeThreshold) {
      // Trigger delete with animation
      handleSwipeDelete(todoId)
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

  const handleSwipeDelete = async (id: number) => {
    // Add to deleting set for animation
    setDeletingTodos(prev => new Set([...prev, id]))
    
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
    const swipeThreshold = -120

    if (deltaX < 0) {
      const clampedDelta = Math.max(deltaX, swipeThreshold)
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
    const swipeThreshold = -80

    if (deltaX < swipeThreshold) {
      handleSwipeDelete(todoId)
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
    localStorage.removeItem('userEmail')
    let newEmail = prompt('Ingresa tu nuevo email:')
    
    // Validar el nuevo email
    while (newEmail && !isValidEmail(newEmail)) {
      newEmail = prompt('Email inválido. Por favor ingresa un email válido (ejemplo: usuario@dominio.com):')
    }
    
    if (newEmail) {
      setUserEmail(newEmail)
      localStorage.setItem('userEmail', newEmail)
      loadTodos(newEmail)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="neu-card p-8">
            <h1 className="text-4xl font-bold mb-4 text-display text-primary">
              Tasks
            </h1>
            <div className="neu-card-inset p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">
                    User: 
                    <span className={`font-medium ml-1 ${isValidEmail(userEmail) ? 'text-green-500' : 'text-red-500'}`}>
                      {userEmail}
                      {isValidEmail(userEmail) ? ' ✓' : ' ⚠️'}
                    </span>
                    <button 
                      onClick={changeUser}
                      className="ml-2 neu-button px-3 py-1 text-sm"
                      style={{ color: 'var(--primary)' }}
                    >
                      change
                    </button>
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {/* N8N Settings Toggle */}
                  <button
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
            <div className="flex gap-4 flex-col sm:flex-row">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="What do you need to do? AI will enhance it"
                className="flex-1 neu-input px-4 py-4 text-base"
                style={{ color: 'var(--foreground)' }}
                disabled={loading}
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
                {loading ? 'Processing...' : `Create with AI ${isTestMode ? '(Test)' : '(Prod)'}`}
              </button>
            </div>
          </div>
        </form>

        {/* Todo List */}
        {todos.length > 0 && (
          <div className="text-center mb-4">
            <div className="neu-card-inset p-3">
              <p className="text-xs text-tertiary">
                💡 Tip: Slide left or drag left to delete tasks
              </p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="neu-card p-12 text-center">
              <div className="neu-pulse">
                <div className="w-16 h-16 mx-auto mb-4 neu-card-inset rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 opacity-40" style={{ color: 'var(--foreground)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2 text-primary">No tasks yet</p>
                <p className="text-sm text-secondary">Create your first AI-enhanced task</p>
              </div>
            </div>
          ) : (
            todos.map((todo) => {
              const swipePosition = swipedTodos[todo.id] || 0
              const isDeleting = deletingTodos.has(todo.id)
              
              return (
                <div
                  key={todo.id}
                  className={`relative overflow-hidden transition-all duration-300 ${
                    isDeleting ? 'animate-pulse opacity-0 scale-95' : 'hover:scale-[1.02]'
                  }`}
                >
                  {/* Delete indicator background */}
                  <div className={`absolute inset-0 bg-gradient-to-l from-red-500 to-red-400 flex items-center justify-end pr-8 transition-all duration-200 rounded-2xl ${
                    swipePosition < -20 ? 'opacity-100' : 'opacity-0'
                  } ${swipePosition < -60 ? 'swipe-delete-indicator' : ''}`}>
                    <TrashIcon className={`w-6 h-6 text-white transition-all duration-200 ${
                      swipePosition < -60 ? 'w-8 h-8' : 'w-6 h-6'
                    }`} />
                    <span className={`text-white font-medium ml-2 transition-all duration-200 ${
                      swipePosition < -60 ? 'text-lg' : 'text-base'
                    }`}>
                      {swipePosition < -60 ? 'Release to Delete' : 'Delete'}
                    </span>
                  </div>
                  
                  {/* Main todo content */}
                  <div
                    className={`neu-card p-5 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                      todo.completed ? 'opacity-70' : ''
                    } ${isDeleting ? 'todo-deleting' : ''} ${
                      swipePosition < -40 ? 'haptic-feedback' : ''
                    }`}
                    style={{
                      transform: `translateX(${swipePosition}px)`,
                      transition: swipePosition === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                      boxShadow: swipePosition < -20 ? 
                        '0 10px 25px rgba(239, 68, 68, 0.2), 0 4px 10px rgba(0, 0, 0, 0.1)' : 
                        undefined
                    }}
                    onTouchStart={(e) => handleTouchStart(e, todo.id)}
                    onTouchMove={(e) => handleTouchMove(e, todo.id)}
                    onTouchEnd={(e) => handleTouchEnd(e, todo.id)}
                    onMouseDown={(e) => handleMouseDown(e, todo.id)}
                    onMouseMove={(e) => handleMouseMove(e, todo.id)}
                    onMouseUp={(e) => handleMouseUp(e, todo.id)}
                    onMouseLeave={(e) => handleMouseUp(e, todo.id)}
                  >
                <div className="flex items-center gap-4">
                  {/* Complete Checkbox */}
                  <button
                    onClick={() => toggleComplete(todo.id, todo.completed)}
                    className={`w-8 h-8 rounded-full neu-button flex items-center justify-center transition-all duration-200 ${
                      todo.completed
                        ? 'text-green-500'
                        : 'hover:text-green-500'
                    }`}
                  >
                    {todo.completed && <CheckIcon className="w-5 h-5" />}
                  </button>

                  {/* Todo Text */}
                  <div className="flex-1">
                    {editingId === todo.id ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full neu-input px-3 py-2 text-base text-primary"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') saveEdit(todo.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="flex flex-col gap-2">
                        <span
                          className={`text-lg font-medium text-primary ${
                            todo.completed
                              ? 'line-through opacity-60'
                              : ''
                          }`}
                        >
                          {todo.title}
                        </span>
                        <div className="text-xs text-tertiary">
                          {new Date(todo.created_at).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {editingId === todo.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(todo.id)}
                          className="neu-button p-3 text-green-500 hover:text-green-600"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="neu-button p-3 text-red-500 hover:text-red-600"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(todo.id, todo.title)}
                          className="neu-button p-3 hover:text-blue-500"
                          style={{ color: 'var(--primary)' }}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="neu-button p-3 text-red-400 hover:text-red-500"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Stats */}
        {todos.length > 0 && (
          <div className="mt-8">
            <div className="neu-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-center card-title">Statistics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="neu-card-inset p-4">
                  <div className="text-3xl font-bold mb-2" style={{ color: 'var(--primary)' }}>{todos.length}</div>
                  <div className="text-sm text-tertiary">Total</div>
                </div>
                <div className="neu-card-inset p-4">
                  <div className="text-3xl font-bold text-green-500 mb-2">
                    {todos.filter(t => t.completed).length}
                  </div>
                  <div className="text-sm text-tertiary">Completed</div>
                </div>
                <div className="neu-card-inset p-4">
                  <div className="text-3xl font-bold text-orange-500 mb-2">
                    {todos.filter(t => !t.completed).length}
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
              <h3 className="text-lg font-semibold mb-2 card-title">AI-Powered Tasks</h3>
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
    </div>
  )
}
