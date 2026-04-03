import React from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeMap = { xs: 24, sm: 28, md: 36, lg: 48 };
const fontSizeMap = { xs: 10, sm: 11, md: 13, lg: 16 };

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const colors = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c',
  '#16a34a', '#0891b2', '#4f46e5', '#be123c',
];

function getColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const dim = sizeMap[size];
  const fs = fontSizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: dim, height: dim, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      title={name}
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        background: getColor(name),
        color: '#fff',
        fontSize: fs,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {getInitials(name)}
    </div>
  );
}
