import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: Date | string;
  className?: string;
}

export function CountdownTimer({ expiresAt, className = '' }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds, total: difference });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpiringSoon = timeRemaining.total > 0 && timeRemaining.total < 3600000; // Less than 1 hour
  const isExpired = timeRemaining.total <= 0;

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`} data-testid="countdown-expired">
        <Clock className="h-4 w-4" />
        <span className="font-mono text-sm">Expired</span>
      </div>
    );
  }

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div
      className={`flex items-center gap-2 ${isExpiringSoon ? 'text-destructive' : 'text-muted-foreground'} ${className}`}
      data-testid="countdown-timer"
    >
      <Clock className="h-4 w-4" />
      <div className="font-mono text-sm tabular-nums">
        <span data-testid="countdown-hours">{formatNumber(timeRemaining.hours)}</span>
        <span className="text-muted-foreground/60">h</span>
        {' '}
        <span data-testid="countdown-minutes">{formatNumber(timeRemaining.minutes)}</span>
        <span className="text-muted-foreground/60">m</span>
        {' '}
        <span data-testid="countdown-seconds">{formatNumber(timeRemaining.seconds)}</span>
        <span className="text-muted-foreground/60">s</span>
      </div>
    </div>
  );
}
