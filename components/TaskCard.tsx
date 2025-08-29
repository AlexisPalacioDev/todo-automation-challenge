'use client'

import { useState } from 'react'
import { CheckIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Todo } from '@/lib/supabase'

interface TaskCardProps {
  todo: Todo
  onToggleComplete: (id: number, completed: boolean) => void
  onEdit: (id: number, title: string) => void
  onDelete: (id: number) => void
  editingId: number | null
  editingText: string
  setEditingId: (id: number | null) => void
  setEditingText: (text: string) => void
  swipePosition?: number
  onTouchStart?: (e: React.TouchEvent, id: number) => void
  onTouchMove?: (e: React.TouchEvent, id: number) => void
  onTouchEnd?: (e: React.TouchEvent, id: number) => void
  onMouseDown?: (e: React.MouseEvent, id: number) => void
  onMouseMove?: (e: React.MouseEvent, id: number) => void
  onMouseUp?: (e: React.MouseEvent, id: number) => void
  onMouseLeave?: (e: React.MouseEvent, id: number) => void
  isDeleting?: boolean
}

export default function TaskCard({ 
  todo, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  editingId, 
  editingText, 
  setEditingId, 
  setEditingText,
  swipePosition = 0,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  isDeleting = false
}: TaskCardProps) {
  
  const startEdit = () => {
    setEditingId(todo.id)
    setEditingText(todo.title)
  }

  const saveEdit = () => {
    if (editingText.trim()) {
      onEdit(todo.id, editingText.trim())
      setEditingId(null)
      setEditingText('')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText('')
  }

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Complete indicator background (right swipe) */}
      <div className={`absolute inset-0 flex items-center justify-start pl-8 transition-all duration-300 rounded-2xl ${
        swipePosition > 10 ? 'opacity-100' : 'opacity-0'
      } ${
        swipePosition > 20 ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-green-200 to-green-300'
      }`}>
        <div className={`flex items-center transition-all duration-300 ${
          swipePosition > 40 ? 'scale-110' : 'scale-100'
        } ${
          swipePosition > 60 ? 'animate-bounce' : ''
        }`}>
          <CheckIcon className={`text-white transition-all duration-300 ${
            swipePosition > 60 ? 'w-10 h-10' : swipePosition > 40 ? 'w-8 h-8' : 'w-6 h-6'
          }`} />
          <span className={`text-white font-bold ml-3 transition-all duration-300 ${
            swipePosition > 60 ? 'text-xl' : swipePosition > 40 ? 'text-lg' : 'text-base'
          }`}>
            {swipePosition > 60 ? '✨ Complete Task' : swipePosition > 40 ? '✨ Complete' : '✅ Mark Done'}
          </span>
        </div>
      </div>
      
      {/* Delete indicator background (left swipe) */}
      <div className={`absolute inset-0 flex items-center justify-end pr-8 transition-all duration-300 rounded-2xl ${
        swipePosition < -10 ? 'opacity-100' : 'opacity-0'
      } ${
        swipePosition < -20 ? 'bg-gradient-to-l from-red-500 to-red-400' : 'bg-gradient-to-l from-red-200 to-red-300'
      }`}>
        <div className={`flex items-center transition-all duration-300 ${
          swipePosition < -40 ? 'scale-110' : 'scale-100'
        } ${
          swipePosition < -60 ? 'animate-bounce' : ''
        }`}>
          <span className={`text-white font-bold mr-3 transition-all duration-300 ${
            swipePosition < -60 ? 'text-xl' : swipePosition < -40 ? 'text-lg' : 'text-base'
          }`}>
            {swipePosition < -60 ? '🗑️ Delete Task' : swipePosition < -40 ? '🗑️ Delete' : '❌ Remove'}
          </span>
          <TrashIcon className={`text-white transition-all duration-300 ${
            swipePosition < -60 ? 'w-10 h-10' : swipePosition < -40 ? 'w-8 h-8' : 'w-6 h-6'
          }`} />
        </div>
      </div>
      
      {/* Main card with enhanced feedback */}
      <div
        className={`
          neu-card relative rounded-2xl p-5 cursor-grab active:cursor-grabbing
          transition-all duration-200
          ${todo.completed ? 'opacity-70' : ''}
          ${isDeleting ? 'animate-pulse opacity-0 scale-95' : 'hover:scale-[1.02]'}
          ${Math.abs(swipePosition) > 40 ? 'scale-[1.05]' : ''}
          ${Math.abs(swipePosition) > 60 ? 'animate-pulse' : ''}
        `}
        style={{
          transform: `translateX(${swipePosition}px) ${Math.abs(swipePosition) > 40 ? 'rotate(' + (swipePosition > 0 ? '1' : '-1') + 'deg)' : ''}`,
          transition: swipePosition === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          // Dynamic shadows and borders based on swipe direction
          boxShadow: swipePosition < -20 ? 
            '0 8px 32px rgba(239, 68, 68, 0.25), 0 4px 16px rgba(0, 0, 0, 0.1)' : 
            swipePosition > 20 ?
            '0 8px 32px rgba(34, 197, 94, 0.25), 0 4px 16px rgba(0, 0, 0, 0.1)' :
            undefined,
          borderLeft: swipePosition > 30 ? '4px solid #22c55e' : undefined,
          borderRight: swipePosition < -30 ? '4px solid #ef4444' : undefined,
        }}
        onTouchStart={onTouchStart ? (e) => onTouchStart(e, todo.id) : undefined}
        onTouchMove={onTouchMove ? (e) => onTouchMove(e, todo.id) : undefined}
        onTouchEnd={onTouchEnd ? (e) => onTouchEnd(e, todo.id) : undefined}
        onMouseDown={onMouseDown ? (e) => onMouseDown(e, todo.id) : undefined}
        onMouseMove={onMouseMove ? (e) => onMouseMove(e, todo.id) : undefined}
        onMouseUp={onMouseUp ? (e) => onMouseUp(e, todo.id) : undefined}
        onMouseLeave={onMouseLeave ? (e) => onMouseLeave(e, todo.id) : undefined}
      >
        <div className="flex items-center gap-4">
          {/* Complete Checkbox */}
          <button
            onClick={() => onToggleComplete(todo.id, todo.completed)}
            className={`
              neu-button w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-200 relative
              ${todo.completed ? 'text-green-500' : 'hover:text-green-500'}
            `}
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
                className="neu-input w-full px-3 py-2 text-base text-primary"
                style={{ color: 'var(--foreground)' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') saveEdit()
                  if (e.key === 'Escape') cancelEdit()
                }}
                autoFocus
              />
            ) : (
              <div className="flex flex-col gap-2">
                <span
                  className={`text-lg font-medium text-primary ${
                    todo.completed ? 'line-through opacity-60' : ''
                  }`}
                  style={{ color: 'var(--foreground)' }}
                >
                  {todo.title}
                </span>
                <div className="text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
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
                  onClick={saveEdit}
                  className="neu-button p-3 text-green-500 hover:text-green-600 rounded-xl transition-all duration-200"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="neu-button p-3 text-red-500 hover:text-red-600 rounded-xl transition-all duration-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEdit}
                  className="neu-button p-3 hover:text-blue-500 rounded-xl transition-all duration-200"
                  style={{ color: 'var(--primary)' }}
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(todo.id)}
                  className="neu-button p-3 text-red-400 hover:text-red-500 rounded-xl transition-all duration-200"
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
}