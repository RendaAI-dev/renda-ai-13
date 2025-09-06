import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showCompanyName?: boolean;
  className?: string;
  onError?: () => void;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-10 w-10'
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl'
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showCompanyName = true,
  className = '',
  onError
}) => {
  const { logoUrl, companyName, logoAltText, isLoading } = useBrandingConfig();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
    onError?.();
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Se está carregando ou não temos dados ainda
  if (isLoading || (!logoUrl && !companyName)) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Skeleton className={`${sizeClasses[size]} rounded-lg`} />
        {showCompanyName && (
          <Skeleton className="h-6 w-24" />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {logoUrl && !imageError ? (
        <div className="relative">
          {!imageLoaded && (
            <Skeleton className={`absolute inset-0 ${sizeClasses[size]} rounded-lg`} />
          )}
          <img 
            src={logoUrl} 
            alt={logoAltText || `Logo ${companyName}`}
            className={`${sizeClasses[size]} object-contain ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="eager"
          />
        </div>
      ) : (
        // Fallback para primeira letra
        <div className={`${sizeClasses[size]} bg-primary rounded-lg flex items-center justify-center flex-shrink-0`}>
          <span className="text-primary-foreground font-bold text-sm">
            {companyName?.charAt(0) || 'P'}
          </span>
        </div>
      )}
      
      {showCompanyName && (
        <span className={`${textSizeClasses[size]} font-bold text-primary`}>
          {companyName || 'PoupeJá!'}
        </span>
      )}
    </div>
  );
}; 