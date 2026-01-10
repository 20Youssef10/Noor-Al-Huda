import { Dhikr } from './types';

export const ADHKAR_DATA: Dhikr[] = [
  {
    id: 1,
    category: 'morning',
    text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    count: 1,
    reference: "رواه مسلم"
  },
  {
    id: 2,
    category: 'morning',
    text: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
    count: 100,
    benefit: "حطت خطاياه وإن كانت مثل زبد البحر"
  },
  {
    id: 3,
    category: 'evening',
    text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ",
    count: 1,
  },
  {
    id: 4,
    category: 'absolute',
    text: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    count: 100,
  },
  {
    id: 5,
    category: 'prayer',
    text: "سُبْحَانَ اللَّهِ (33)، الْحَمْدُ لِلَّهِ (33)، اللَّهُ أَكْبَرُ (33)",
    count: 33,
  }
];

// Helper for Arabic numbers
export const toArabicNumerals = (n: number | string): string => {
  return n.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
};