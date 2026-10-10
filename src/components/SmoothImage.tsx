import React, { useState, useRef, useEffect } from 'react';

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' viewBox='0 0 400 533'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Cpath d='M160 210h80v80h-80z' fill='%23D1D5DB'/%3E%3C/svg%3E";

interface SmoothImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

export default function SmoothImage({
  src,
  alt,
  className = '',
  onLoad,
  onError,
  style,
  width,
  height,
  ...props
}: SmoothImageProps) {
  const isEager = props.fetchPriority === 'high' || props.loading === 'eager';
  const [isLoaded, setIsLoaded] = useState(isEager);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isEager) {
      setIsLoaded(true);
      return;
    }
    setHasError(false);
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      } else {
        setHasError(true);
      }
    }
  }, [src, isEager]);

  return (
    <img
      ref={imgRef}
      src={hasError ? FALLBACK_IMAGE : (src || FALLBACK_IMAGE)}
      alt={alt}
      width={width || 400}
      height={height || 533}
      decoding={props.decoding || (isEager ? 'sync' : 'async')}
      style={{ aspectRatio: '3 / 4', ...style }}
      onLoad={(e) => {
        setIsLoaded(true);
        setHasError(false);
        if (onLoad) onLoad(e);
      }}
      onError={(e) => {
        setHasError(true);
        setIsLoaded(true);
        const target = e.currentTarget;
        if (target.src !== FALLBACK_IMAGE) {
          target.src = FALLBACK_IMAGE;
        }
        if (onError) onError(e);
      }}
      className={`${
        isEager
          ? 'opacity-100'
          : `transition-opacity duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`
      } ${className}`}
      {...props}
    />
  );
}
