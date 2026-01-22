// Achievement system - professional and subtle

import { Achievement } from '@/components/achievements/Badge'

export const ACHIEVEMENTS: Record<string, Achievement> = {
  module1: {
    id: 'module1',
    title: 'Foundation Complete',
    description: 'Mastered concussion biomechanics and pathophysiology',
    icon: 'brain',
    earned: false
  },
  module2: {
    id: 'module2',
    title: 'Assessment Proficient',
    description: 'Completed SCAT6 and VOMS training',
    icon: 'target',
    earned: false
  },
  module3: {
    id: 'module3',
    title: 'Clinical Ready',
    description: 'Acute management protocols mastered',
    icon: 'check',
    earned: false
  },
  module4: {
    id: 'module4',
    title: 'PCS Specialist',
    description: 'Long-term management strategies acquired',
    icon: 'zap',
    earned: false
  },
  halfway: {
    id: 'halfway',
    title: 'Halfway There',
    description: 'Completed 4 of 8 online modules',
    icon: 'target',
    earned: false
  },
  allComplete: {
    id: 'allComplete',
    title: 'Clinical Mastery',
    description: 'All 8 online modules completed - 8 online CPD points earned',
    icon: 'award',
    earned: false
  }
}

export function checkAchievements(completedModules: number[]): Achievement[] {
  const earned: Achievement[] = []

  // Module completions
  if (completedModules.includes(1)) {
    earned.push({ ...ACHIEVEMENTS.module1, earned: true, earnedDate: new Date() })
  }
  if (completedModules.includes(2)) {
    earned.push({ ...ACHIEVEMENTS.module2, earned: true, earnedDate: new Date() })
  }
  if (completedModules.includes(3)) {
    earned.push({ ...ACHIEVEMENTS.module3, earned: true, earnedDate: new Date() })
  }
  if (completedModules.includes(4)) {
    earned.push({ ...ACHIEVEMENTS.module4, earned: true, earnedDate: new Date() })
  }

  // Milestones
  if (completedModules.length >= 4) {
    earned.push({ ...ACHIEVEMENTS.halfway, earned: true, earnedDate: new Date() })
  }
  if (completedModules.length === 8) {
    earned.push({ ...ACHIEVEMENTS.allComplete, earned: true, earnedDate: new Date() })
  }

  return earned
}

export function getNextAchievement(completedModules: number[]): Achievement | null {
  if (completedModules.length === 0) {
    return ACHIEVEMENTS.module1
  }
  if (completedModules.length === 1) {
    return ACHIEVEMENTS.module2
  }
  if (completedModules.length === 2) {
    return ACHIEVEMENTS.module3
  }
  if (completedModules.length === 3) {
    return ACHIEVEMENTS.module4
  }
  if (completedModules.length >= 4 && completedModules.length < 8) {
    return ACHIEVEMENTS.allComplete
  }
  return null
}
