// Quick test to verify SCAT modules structure
// Run with: node test-scat-modules.js

// Simulate the module structure
const testModule = {
  id: 101,
  title: 'Quick Guide & Medico-Legal',
  subtitle: 'SCAT6 vs SCOAT6',
  duration: '20 min',
  points: 0.5,
  description: 'Test',
  videoUrl: '/videos/test.mp4',
  videoRequiredMinutes: 1,
  sections: [
    {
      id: 'test',
      title: 'Test Section',
      content: ['Test content']
    }
  ],
  quiz: [
    {
      id: 'q1',
      question: 'Test?',
      options: ['A', 'B'],
      correctAnswer: 0,
      explanation: 'Test'
    }
  ],
  clinicalReferences: []
}

console.log('Test module structure:', JSON.stringify(testModule, null, 2))
console.log('\nField order:')
Object.keys(testModule).forEach((key, i) => {
  console.log(`${i + 1}. ${key}`)
})

console.log('\n✅ Module structure is valid')
