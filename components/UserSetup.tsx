'use client'

import { useState } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface UserSetupProps {
  isFirstTime: boolean
  onEmailSubmit: (email: string) => void
  onCancel?: () => void
}

export default function UserSetup({ isFirstTime, onEmailSubmit, onCancel }: UserSetupProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address (example: user@domain.com)')
      return
    }

    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300)) // Small delay for UX
      onEmailSubmit(email.trim())
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="neu-card max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 neu-card-inset rounded-full flex items-center justify-center">
            <span className="text-3xl">
              {isFirstTime ? '🎉' : '👤'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">
            {isFirstTime ? 'Welcome to TaskForge AI!' : 'Change User'}
          </h2>
          <p className="text-sm text-secondary">
            {isFirstTime 
              ? 'Enter your email to get started with AI-enhanced task management' 
              : 'Enter a new email address to switch users'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('') // Clear error when typing
              }}
              placeholder="user@example.com"
              className="neu-input w-full px-4 py-3 text-base"
              style={{ color: 'var(--foreground)' }}
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                <XMarkIcon className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {!isFirstTime && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="neu-button px-4 py-3 flex-1 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className={`neu-button px-4 py-3 flex-1 font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                isLoading || !email.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ 
                background: 'linear-gradient(145deg, var(--primary), var(--primary-dark))',
                color: 'white'
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  {isFirstTime ? 'Get Started' : 'Switch User'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Additional info for first time users */}
        {isFirstTime && (
          <div className="mt-6 neu-card-inset p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">🔒</span>
              <div>
                <h4 className="font-medium text-primary text-sm mb-1">Privacy & Security</h4>
                <p className="text-xs text-secondary leading-relaxed">
                  Your email is only used to save your tasks locally and sync with our AI services. 
                  We don't send marketing emails or share your data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}