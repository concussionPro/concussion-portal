// Immediate Memory word lists - identical to SCAT6/SCOAT6

export const WORD_LISTS = {
  A: [
    'Jacket',
    'Arrow',
    'Pepper',
    'Cotton',
    'Movie',
    'Dollar',
    'Honey',
    'Mirror',
    'Saddle',
    'Anchor',
  ],
  B: [
    'Finger',
    'Penny',
    'Blanket',
    'Lemon',
    'Insect',
    'Candle',
    'Paper',
    'Sugar',
    'Sandwich',
    'Wagon',
  ],
  C: [
    'Baby',
    'Monkey',
    'Perfume',
    'Sunset',
    'Iron',
    'Elbow',
    'Apple',
    'Carpet',
    'Saddle',
    'Bubble',
  ],
} as const

export type WordListKey = keyof typeof WORD_LISTS
