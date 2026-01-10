interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

export default function Logo({ className = '', size = 'md', variant = 'full' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-12',
  };

  const logoSrc = variant === 'full'
    ? '/assets/images/amplify_logo.png'
    : '/assets/images/amplify_logo_only.png';

  return (
    <img
      src={logoSrc}
      alt="Amplify Logo"
      className={`${sizeClasses[size]} w-auto ${className}`}
    />
  );
}
