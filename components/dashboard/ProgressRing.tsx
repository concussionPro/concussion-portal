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
  const circumference = 2 * Math.PI * 42

  const springProgress = useSpring(0, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.01,
  })

  const strokeDashoffset = useTransform(
    springProgress,
    [0, 100],
    [circumference, 0],
  )

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      springProgress.set(percentage)
    }, 300)
    return () => clearTimeout(timer)
  }, [percentage, springProgress])

  if (!mounted) return null

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative w-28 h-28"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg className="transform -rotate-90 w-28 h-28">
          {/* Background circle */}
          <circle
            cx="56"
            cy="56"
            r="42"
            strokeWidth="6"
            fill="none"
            className="stroke-[rgba(91,154,166,0.1)]"
          />
          {/* Progress circle */}
          <motion.circle
            cx="56"
            cy="56"
            r="42"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            className="stroke-accent"
            initial={{ strokeDashoffset: circumference }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <motion.span
            className="text-2xl font-bold text-foreground tracking-tight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {progress}
          </motion.span>
          <motion.span
            className="text-[10px] text-muted-foreground font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            / {total}
          </motion.span>
        </div>
      </motion.div>

      <motion.div
        className="mt-3 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <p className="text-xs font-semibold text-foreground">Online CPD</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Modules Completed</p>
      </motion.div>
    </div>
  )
}
