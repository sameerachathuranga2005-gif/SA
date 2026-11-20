export type VirtualBackgroundType =
  | 'none'
  | 'blur-soft'
  | 'blur-strong'
  | 'blur-light'
  | 'blur-heavy'
  | 'custom'
  | 'modern-office'
  | 'cozy-studio'
  | 'minimal-interior'
  | 'skyline-penthouse'
  | 'nature-beach'
  | 'plant-loft';

export interface IVirtualBackgroundPreset {
  id: VirtualBackgroundType;
  label: string;
  category: 'none' | 'blur' | 'interior' | 'scenic' | 'custom';
  type: 'none' | 'blur' | 'image';
  previewUrl?: string;
  imageUrl?: string;
  blurAmount?: number;
}

export const VIRTUAL_BACKGROUND_PRESETS: IVirtualBackgroundPreset[] = [
  {
    id: 'none',
    label: 'None',
    category: 'none',
    type: 'none',
  },
  {
    id: 'blur-soft',
    label: 'Soft Blur (12px)',
    category: 'blur',
    type: 'blur',
    blurAmount: 12,
    previewUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 'blur-strong',
    label: 'Strong Blur (20px)',
    category: 'blur',
    type: 'blur',
    blurAmount: 20,
    previewUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=320&q=80',
  },
  // 6 Curated High-Resolution Real-World Backgrounds
  {
    id: 'modern-office',
    label: 'Executive Tech Office',
    category: 'interior',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=320&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'cozy-studio',
    label: 'Cozy Library Studio',
    category: 'interior',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=320&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'minimal-interior',
    label: 'Minimalist Architecture',
    category: 'interior',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=320&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'skyline-penthouse',
    label: 'Skyline Penthouse',
    category: 'interior',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=320&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'nature-beach',
    label: 'Lush Tropical Beach',
    category: 'scenic',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=320&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'plant-loft',
    label: 'Scandinavian Plant Loft',
    category: 'scenic',
    type: 'image',
    previewUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=320&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80',
  },
];
