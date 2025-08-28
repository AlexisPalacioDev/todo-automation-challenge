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
  const [isTestMode, setIsTestMode] = useState(true)
  const [customUrl, setCustomUrl] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)

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

  const loadTodos = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.error('Error loading todos:', error)
      alert('Error al cargar las tareas. Revisa la consola.')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            To-Do List App
          </h1>
          <p className="text-gray-300">
            Usuario: 
            <span className={`font-semibold ml-1 ${isValidEmail(userEmail) ? 'text-green-400' : 'text-red-400'}`}>
              {userEmail}
              {isValidEmail(userEmail) ? ' ✓' : ' ⚠️'}
            </span>
            <button 
              onClick={changeUser}
              className="ml-2 text-blue-400 hover:text-blue-300 text-sm underline"
            >
              cambiar
            </button>
          </p>
        </div>

        {/* N8N Controls */}
        <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex flex-col gap-4">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">Modo N8N:</span>
                <button
                  onClick={() => setIsTestMode(!isTestMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isTestMode 
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isTestMode ? '🧪 Test Mode' : '🚀 Producción'}
                </button>
              </div>
              
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                {showUrlInput ? 'Ocultar URL' : 'URL Personalizada'}
              </button>
            </div>

            {/* Current URL Display */}
            <div className="text-sm">
              <span className="text-gray-400">URL Actual: </span>
              <code className="text-green-400 bg-slate-700 px-2 py-1 rounded">
                {getWebhookUrl()}
              </code>
            </div>

            {/* Custom URL Input */}
            {showUrlInput && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://tu-n8n.com/webhook/todo-webhook"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setCustomUrl('')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="¿Qué necesitas hacer? (Se mejorará con IA)"
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newTodo.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              {loading ? 'Procesando...' : `Crear con IA ${isTestMode ? '(Test)' : '(Prod)'}`}
            </button>
          </div>
        </form>

        {/* Todo List */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No hay tareas aún</p>
              <p className="text-sm">¡Agrega tu primera tarea con IA!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 transition-all duration-200 hover:shadow-xl hover:border-slate-600 ${
                  todo.completed ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Complete Checkbox */}
                  <button
                    onClick={() => toggleComplete(todo.id, todo.completed)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      todo.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {todo.completed && <CheckIcon className="w-4 h-4" />}
                  </button>

                  {/* Todo Text */}
                  <div className="flex-1">
                    {editingId === todo.id ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-700 border border-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') saveEdit(todo.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`${
                          todo.completed
                            ? 'line-through text-gray-500'
                            : 'text-white'
                        }`}
                      >
                        {todo.title}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {editingId === todo.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(todo.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(todo.id, todo.title)}
                          className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="mt-2 text-xs text-gray-500">
                  Creada: {new Date(todo.created_at).toLocaleString('es-ES')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        {todos.length > 0 && (
          <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{todos.length}</div>
                <div className="text-sm text-gray-400">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {todos.filter(t => t.completed).length}
                </div>
                <div className="text-sm text-gray-400">Completadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {todos.filter(t => !t.completed).length}
                </div>
                <div className="text-sm text-gray-400">Pendientes</div>
              </div>
            </div>
          </div>
        )}

        {/* N8N Integration Info */}
        <div className="mt-6 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">🤖 Potenciado por IA</h3>
            <p className="text-sm text-gray-400">
              Tus tareas son procesadas por inteligencia artificial a través de N8N workflow
            </p>
            <p className="text-xs text-gray-500 mt-1">
              OpenAI + Telegram + Supabase Integration
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
