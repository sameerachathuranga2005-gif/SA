export type VirtualBackgroundType =
  | 'none'
  | 'blur-light'
  | 'blur-heavy'
  | 'studio-blue'
  | 'studio-green'
  | 'executive-boardroom'
  | 'office'
  | 'penthouse'
  | 'cafe'
  | 'ocean-beach'
  | 'deep-galaxy'
  | 'neon-cyber';

export interface IVirtualBackgroundPreset {
  id: VirtualBackgroundType;
  label: string;
  category: 'none' | 'blur' | 'chroma' | 'interior' | 'scenic';
  type: 'none' | 'blur' | 'color' | 'image';
  previewUrl?: string;
  imageUrl?: string;
  bgColor?: string;
  cssFilter?: string;
}

export const VIRTUAL_BACKGROUND_PRESETS: IVirtualBackgroundPreset[] = [
  {
    id: 'none',
    label: 'None',
    category: 'none',
    type: 'none',
  },
  {
    id: 'blur-light',
    label: 'Slight Blur',
    category: 'blur',
    type: 'blur',
    previewUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=160&h=100&fit=crop',
    cssFilter: 'blur(8px)',
  },
  {
    id: 'blur-heavy',
    label: 'Cinematic Blur',
    category: 'blur',
    type: 'blur',
    previewUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=160&h=100&fit=crop',
    cssFilter: 'blur(22px)',
  },
  // Studio Solid Screens (Blue Screen & Green Screen)
  {
    id: 'studio-blue',
    label: 'Studio Blue Screen',
    category: 'chroma',
    type: 'color',
    bgColor: '#0047bb', // Chroma Key Blue
  },
  {
    id: 'studio-green',
    label: 'Studio Green Screen',
    category: 'chroma',
    type: 'color',
    bgColor: '#00b140', // Chroma Key Green
  },
  // Interiors
  {
    id: 'executive-boardroom',
    label: 'Executive Boardroom',
    category: 'interior',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=160&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1920&q=80&fit=crop',
  },
  {
    id: 'office',
    label: 'Modern Tech Office',
    category: 'interior',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=160&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1920&q=80&fit=crop',
  },
  {
    id: 'penthouse',
    label: 'Skyline Penthouse',
    category: 'interior',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=160&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1920&q=80&fit=crop',
  },
  {
    id: 'cafe',
    label: 'Cozy Cafe',
    category: 'interior',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=160&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=80&fit=crop',
  },
  // Scenic & Creative
  {
    id: 'ocean-beach',
    label: 'Tropical Sunset Beach',
    category: 'scenic',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=160&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80&fit=crop',
  },
  {
    id: 'deep-galaxy',
    label: 'Deep Space Nebula',
    category: 'scenic',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=160&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1920&q=80&fit=crop',
  },
  {
    id: 'neon-cyber',
    label: 'Cyberpunk Neon Studio',
    category: 'scenic',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=160&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80&fit=crop',
  },
];
