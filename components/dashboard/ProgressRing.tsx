'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ProgressRingProps {
  progress: number
  total: number
}

export function ProgressRing({ progress, total }: ProgressRingProps) {
  const [mounted, setMounted] = useState(false)
  const percentage = (progress / total) * 100
  const circumference = 2 * Math.PI * 45

  // Smooth spring animation for the progress
  const springProgress = useSpring(0, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.01,
  })

  const strokeDashoffset = useTransform(
    springProgress,
    [0, 100],
    [circumference, 0]
  )

  useEffect(() => {
    setMounted(true)
    // Delay the animation slightly for better effect
    const timer = setTimeout(() => {
      springProgress.set(percentage)
    }, 300)
    return () => clearTimeout(timer)
  }, [percentage, springProgress])

  if (!mounted) return null

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative w-32 h-32"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.34, 1.56, 0.64, 1],
        }}
      >
        <svg className="transform -rotate-90 w-32 h-32">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          {/* Progress circle with Apple blue */}
          <motion.circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            className="text-accent drop-shadow-[0_0_6px_rgba(0,122,255,0.4)]"
            initial={{ strokeDashoffset: circumference }}
          />
        </svg>

        {/* Center content with count-up animation */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <motion.span
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {progress}
          </motion.span>
          <motion.span
            className="text-xs text-muted-foreground font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            / {total}
          </motion.span>
        </div>

        {/* Animated glow ring */}
        {progress > 0 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0,122,255,0.08) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>

      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <p className="text-sm font-bold text-foreground">Online CPD Progress</p>
        <p className="text-xs text-muted-foreground mt-0.5">Modules Completed</p>
      </motion.div>
    </div>
  )
}
