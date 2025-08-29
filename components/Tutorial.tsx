'use client'

import { useState, useEffect, useRef } from 'react'
import { XMarkIcon, ChevronRightIcon, ChevronLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

interface TutorialStep {
  id: number
  title: string
  description: string
  target: string
  position: 'top' | 'bottom' | 'left' | 'right'
  emoji: string
  action?: string
}

interface TutorialProps {
  isFirstTime: boolean
  onComplete: () => void
  onStepChange?: (step: number) => void
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to TaskForge AI!",
    description: "Your intelligent task management companion that enhances your todos using AI workflows. Let's take a quick tour!",
    target: "header",
    position: "bottom",
    emoji: "👋"
  },
  {
    id: 2,
    title: "Create Smart Tasks",
    description: "Watch the magic happen! See how typing 'buy eggs' gets automatically enhanced with AI into a detailed, actionable task with smart suggestions.",
    target: "task-input",
    position: "bottom",
    emoji: "🤖",
    action: "show-ai-demo"
  },
  {
    id: 3,
    title: "Swipe to Complete",
    description: "Try swiping right on the demo task below to mark it as complete. You'll see satisfying visual feedback!",
    target: "task-list",
    position: "bottom",
    emoji: "👉"
  },
  {
    id: 4,
    title: "Swipe to Delete",
    description: "Now try swiping left on a demo task to delete it. Perfect for quickly removing completed items!",
    target: "task-list",
    position: "bottom",
    emoji: "👈"
  },
  {
    id: 5,
    title: "Configure Your Experience",
    description: "Click this settings button to change users, switch between test/production modes, or customize your N8N webhook URL.",
    target: "settings-button",
    position: "bottom",
    emoji: "⚙️"
  },
  {
    id: 6,
    title: "Track Your Progress",
    description: "This statistics panel shows your productivity metrics. Use these numbers to track your accomplishments and stay motivated!",
    target: "stats-section",
    position: "top",
    emoji: "📊"
  },
  {
    id: 7,
    title: "You're All Set!",
    description: "Perfect! You're now ready to boost your productivity with AI-enhanced task management. Start creating your first smart task!",
    target: "task-input",
    position: "bottom",
    emoji: "🎯"
  }
]

export default function Tutorial({ isFirstTime, onComplete, onStepChange }: TutorialProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Initialize step change callback
  useEffect(() => {
    onStepChange?.(currentStep)
  }, [])


  useEffect(() => {
    if (isOpen) {
      const findAndPositionElement = (retryCount = 0) => {
        const targetElement = document.getElementById(tutorialSteps[currentStep].target)
        console.log(`Tutorial step ${currentStep + 1}: Looking for element "${tutorialSteps[currentStep].target}"`, targetElement, `(retry ${retryCount})`)
        
        if (targetElement) {
          // Improved scroll behavior with better positioning
          const scrollOptions = {
            behavior: 'smooth' as ScrollBehavior,
            block: currentStepData.target === 'stats-section' ? 'end' as ScrollLogicalPosition : 'center' as ScrollLogicalPosition,
            inline: 'center' as ScrollLogicalPosition
          }
          
          targetElement.scrollIntoView(scrollOptions)
          
          // Add highlight class with delay for better visual effect
          setTimeout(() => {
            targetElement.classList.add('tutorial-highlight')
          }, 100)
          
          // Update tooltip position after scroll and highlight complete
          setTimeout(() => {
            updateTooltipPosition()
          }, 600)
          
          // Return cleanup function
          return () => {
            targetElement.classList.remove('tutorial-highlight')
          }
        } else if (retryCount < 3) {
          // Element not found, retry after a short delay
          console.warn(`Tutorial: Target element "${tutorialSteps[currentStep].target}" not found, retrying...`)
          setTimeout(() => {
            findAndPositionElement(retryCount + 1)
          }, 200)
        } else {
          // Element not found after retries, use fallback positioning
          console.warn(`Tutorial: Target element "${tutorialSteps[currentStep].target}" not found after retries, using fallback positioning`)
          setTimeout(() => {
            updateTooltipPosition()
          }, 100)
        }
      }
      
      return findAndPositionElement()
    }
  }, [isOpen, currentStep])

  // Update tooltip position on window resize
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => updateTooltipPosition()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  const updateTooltipPosition = () => {
    const currentStepData = tutorialSteps[currentStep]
    const targetElement = document.getElementById(currentStepData.target)
    
    if (!tooltipRef.current) return
    
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    let top = 0
    let left = 0
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    if (targetElement) {
      const targetRect = targetElement.getBoundingClientRect()
      const targetCenterX = targetRect.left + (targetRect.width / 2)
      const targetCenterY = targetRect.top + (targetRect.height / 2)
      
      // Improved positioning logic with overflow protection
      switch (currentStepData.position) {
        case 'bottom':
          top = targetRect.bottom + window.scrollY + 20
          left = targetCenterX + window.scrollX - (tooltipRect.width / 2)
          
          // If tooltip goes below viewport, position it above instead
          if (targetRect.bottom + tooltipRect.height + 40 > viewportHeight) {
            top = targetRect.top + window.scrollY - tooltipRect.height - 20
          }
          break
          
        case 'top':
          top = targetRect.top + window.scrollY - tooltipRect.height - 20
          left = targetCenterX + window.scrollX - (tooltipRect.width / 2)
          
          // If tooltip goes above viewport, position it below instead
          if (top - window.scrollY < 80) {
            top = targetRect.bottom + window.scrollY + 20
          }
          break
          
        case 'left':
          top = targetCenterY + window.scrollY - (tooltipRect.height / 2)
          left = targetRect.left + window.scrollX - tooltipRect.width - 20
          
          // If tooltip goes off left edge, position it on right instead
          if (left < 24) {
            left = targetRect.right + window.scrollX + 20
          }
          break
          
        case 'right':
          top = targetCenterY + window.scrollY - (tooltipRect.height / 2)
          left = targetRect.right + window.scrollX + 20
          
          // If tooltip goes off right edge, position it on left instead
          if (left + tooltipRect.width > viewportWidth - 24) {
            left = targetRect.left + window.scrollX - tooltipRect.width - 20
          }
          break
      }
      
      // Special handling for problematic targets
      if (currentStepData.target === 'stats-section') {
        // Force stats tutorial to be positioned higher to avoid overlap
        const idealTop = targetRect.top + window.scrollY - tooltipRect.height - 30
        const minAllowedTop = 100 + window.scrollY
        top = Math.max(idealTop, minAllowedTop)
        
        // If still not enough room, position to the side
        if (top > targetRect.top + window.scrollY - 50) {
          top = targetCenterY + window.scrollY - (tooltipRect.height / 2)
          left = viewportWidth - tooltipRect.width - 30
        }
      }
      
    } else {
      // Enhanced fallback positioning
      console.warn(`Using fallback positioning for step: ${currentStepData.title}`)
      
      switch (currentStepData.target) {
        case 'task-input':
          top = Math.max(250, viewportHeight * 0.3) + window.scrollY
          left = (viewportWidth / 2) - (tooltipRect.width / 2)
          break
        case 'settings-button':
          top = 150 + window.scrollY
          left = Math.min(viewportWidth - tooltipRect.width - 50, viewportWidth - 350)
          break
        case 'stats-section':
          // Position stats fallback at top of viewport to avoid overlap
          top = 120 + window.scrollY
          left = (viewportWidth / 2) - (tooltipRect.width / 2)
          break
        default:
          // Safer center positioning
          top = Math.max(200, viewportHeight * 0.3) + window.scrollY
          left = (viewportWidth / 2) - (tooltipRect.width / 2)
      }
    }
    
    // Enhanced viewport constraints with safe margins
    const minTop = 100 + window.scrollY // More space for header
    const maxTop = window.innerHeight + window.scrollY - tooltipRect.height - 60
    const minLeft = 20
    const maxLeft = viewportWidth - tooltipRect.width - 20
    
    // Apply constraints
    left = Math.max(minLeft, Math.min(left, maxLeft))
    top = Math.max(minTop, Math.min(top, maxTop))
    
    setTooltipPosition({ top, left })
  }

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      onStepChange?.(newStep)
    } else {
      completeTutorial()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      onStepChange?.(newStep)
    }
  }

  const completeTutorial = () => {
    // Remove highlight from all possible elements to ensure cleanup
    tutorialSteps.forEach(step => {
      const element = document.getElementById(step.target)
      if (element) {
        element.classList.remove('tutorial-highlight')
      }
    })
    
    // Smooth transition out
    setTimeout(() => {
      setIsOpen(false)
      setCurrentStep(0)
      onComplete()
    }, 200)
  }

  const skipTutorial = () => {
    completeTutorial()
  }

  if (!isOpen) return null

  const currentStepData = tutorialSteps[currentStep]

  return (
    <>
      {/* Subtle backdrop overlay - less intrusive */}
      <div className="fixed inset-0 bg-black bg-opacity-10 z-[45] pointer-events-none transition-opacity duration-300" />
      
      {/* Floating tooltip with improved positioning and styling */}
      <div
        ref={tooltipRef}
        className="fixed z-[50] tutorial-tooltip neu-card p-4 animate-in fade-in zoom-in duration-300 shadow-2xl border border-gray-200 dark:border-gray-700"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentStepData.emoji}</span>
                <div>
                  <h4 className="font-bold text-primary text-sm">{currentStepData.title}</h4>
                  <p className="text-xs text-secondary">
                    {currentStep + 1}/{tutorialSteps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={skipTutorial}
                className="neu-button p-1 text-gray-500 hover:text-red-500 text-sm"
                title="Close tutorial"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-primary mb-4 leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-1 mb-4">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentStep 
                      ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                      : index < currentStep
                      ? 'bg-green-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`neu-button px-3 py-1 flex items-center gap-1 text-sm transition-all duration-200 ${
                  currentStep === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-500'
                }`}
                style={{ color: 'var(--primary)' }}
              >
                <ChevronLeftIcon className="w-3 h-3" />
                Back
              </button>

              <button
                onClick={skipTutorial}
                className="text-xs text-tertiary hover:text-secondary transition-colors duration-200"
              >
                Skip
              </button>

              <button
                onClick={nextStep}
                className="neu-button px-3 py-1 flex items-center gap-1 text-sm font-medium transition-all duration-200"
                style={{ 
                  background: currentStep === tutorialSteps.length - 1 
                    ? 'linear-gradient(145deg, var(--success), #059669)' 
                    : 'linear-gradient(145deg, var(--primary), var(--primary-dark))',
                  color: 'white'
                }}
              >
                {currentStep === tutorialSteps.length - 1 ? 'Done' : 'Next'}
                <ChevronRightIcon className="w-3 h-3" />
              </button>
            </div>

            {/* Arrow pointing to target (only show if target element exists) */}
            {document.getElementById(currentStepData.target) && (
              <div 
                className={`absolute w-4 h-4 bg-inherit shadow-sm transform rotate-45 ${
                  currentStepData.position === 'bottom' ? '-top-2 left-1/2 -translate-x-1/2 border-t border-l border-gray-200 dark:border-gray-700' :
                  currentStepData.position === 'top' ? '-bottom-2 left-1/2 -translate-x-1/2 border-r border-b border-gray-200 dark:border-gray-700' :
                  currentStepData.position === 'left' ? '-right-2 top-1/2 -translate-y-1/2 border-t border-r border-gray-200 dark:border-gray-700' :
                  '-left-2 top-1/2 -translate-y-1/2 border-l border-b border-gray-200 dark:border-gray-700'
                }`}
              />
            )}
          </div>
    </>
  )
}