/**
 * Device detection utilities for mobile-optimized wallet connections
 */

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Common mobile patterns
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
  
  return mobileRegex.test(userAgent.toLowerCase());
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android/i.test(userAgent);
}

export function canUseMetaMask(): boolean {
  // MetaMask is available if ethereum object exists (desktop browser extension)
  return typeof window !== 'undefined' && !!window.ethereum;
}

export function shouldUseDeepLink(): boolean {
  // Use deep linking on mobile devices
  return isMobile();
}
