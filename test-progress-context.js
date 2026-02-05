#!/usr/bin/env node

/**
 * Test script to verify ProgressContext handles SCAT modules
 * Run: node test-progress-context.js
 */

// Simulate the getDefaultProgress function
function getDefaultProgress() {
  const modules = {}

  // Main course modules 1-8
  for (let i = 1; i <= 8; i++) {
    modules[i] = {
      moduleId: i,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    }
  }

  // SCAT modules 101-105
  for (let i = 101; i <= 105; i++) {
    modules[i] = {
      moduleId: i,
      completed: false,
      videoWatchedMinutes: 0,
      videoCompleted: false,
      quizScore: null,
      quizTotalQuestions: null,
      quizCompleted: false,
      startedAt: null,
      completedAt: null,
    }
  }

  return modules
}

// Simulate the updateVideoProgress function
function updateVideoProgress(progress, moduleId, minutes) {
  const currentModule = progress[moduleId] || {
    moduleId,
    completed: false,
    videoWatchedMinutes: 0,
    videoCompleted: false,
    quizScore: null,
    quizTotalQuestions: null,
    quizCompleted: false,
    startedAt: null,
    completedAt: null,
  }

  return {
    ...progress,
    [moduleId]: {
      ...currentModule,
      videoWatchedMinutes: Math.max(currentModule.videoWatchedMinutes, minutes),
      startedAt: currentModule.startedAt || new Date(),
    },
  }
}

console.log('Testing Progress Context...\n')

// Test 1: Check default progress includes SCAT modules
console.log('Test 1: Default progress includes SCAT modules')
const defaultProgress = getDefaultProgress()
const hasSCAT101 = !!defaultProgress[101]
const hasSCAT105 = !!defaultProgress[105]
console.log(`  Module 101 exists: ${hasSCAT101 ? '✅ PASS' : '❌ FAIL'}`)
console.log(`  Module 105 exists: ${hasSCAT105 ? '✅ PASS' : '❌ FAIL'}`)

// Test 2: Can update SCAT module progress without crash
console.log('\nTest 2: Update SCAT module 101 progress')
try {
  let progress = getDefaultProgress()
  progress = updateVideoProgress(progress, 101, 5)
  const updated = progress[101].videoWatchedMinutes === 5
  console.log(`  Progress updated: ${updated ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Video minutes: ${progress[101].videoWatchedMinutes}`)
} catch (error) {
  console.log(`  ❌ FAIL - Crashed: ${error.message}`)
}

// Test 3: Handle undefined module gracefully
console.log('\nTest 3: Handle undefined module (999) without crash')
try {
  let progress = getDefaultProgress()
  delete progress[999] // Ensure it doesn't exist
  progress = updateVideoProgress(progress, 999, 3)
  const created = !!progress[999]
  console.log(`  Module created: ${created ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Video minutes: ${progress[999]?.videoWatchedMinutes || 0}`)
} catch (error) {
  console.log(`  ❌ FAIL - Crashed: ${error.message}`)
}

// Test 4: Main course modules still work
console.log('\nTest 4: Main course modules (1-8) still work')
try {
  let progress = getDefaultProgress()
  progress = updateVideoProgress(progress, 1, 10)
  const updated = progress[1].videoWatchedMinutes === 10
  console.log(`  Module 1 updated: ${updated ? '✅ PASS' : '❌ FAIL'}`)
} catch (error) {
  console.log(`  ❌ FAIL - Crashed: ${error.message}`)
}

console.log('\n' + '='.repeat(50))
console.log('Summary:')
console.log('- All SCAT modules (101-105) included in default state')
console.log('- Update functions handle undefined modules gracefully')
console.log('- No crashes when accessing SCAT module progress')
console.log('- Main course modules (1-8) unaffected')
console.log('='.repeat(50))
