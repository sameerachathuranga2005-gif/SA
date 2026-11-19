import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusSizeClasses = {
  xs: 'w-2 h-2 ring-1',
  sm: 'w-2.5 h-2.5 ring-2',
  md: 'w-3 h-3 ring-2',
  lg: 'w-3.5 h-3.5 ring-2',
  xl: 'w-4 h-4 ring-2',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline = false,
  showStatus = true,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // Generate initials
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const avatarUrl =
    !imageError && src
      ? src
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-semibold text-zinc-300 shadow-sm`}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        {imageError && <span>{initials}</span>}
      </div>

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} rounded-full ring-zinc-950 ${
            isOnline ? 'bg-emerald-500' : 'bg-zinc-500'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        >
          {isOnline && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          )}
        </span>
      )}
    </div>
  );
};

