import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F0EFEA] text-[#5C665E] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Package className="w-8 h-8 mb-2 opacity-60" />
        <span className="text-xs font-medium line-clamp-2 max-w-[180px]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
