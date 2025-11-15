import { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  height?: number;
}

export function TradingViewWidget({ symbol, height = 300 }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (containerRef.current && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: false,
          symbol: `BINANCE:${symbol}`,
          interval: '60',
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: true,
          save_image: false,
          container_id: containerRef.current.id,
          width: '100%',
          height: height,
          studies: [],
          disabled_features: ['use_localstorage_for_settings', 'header_widget'],
          enabled_features: ['hide_left_toolbar_by_default'],
        });
      }
    };

    const container = containerRef.current;
    container.appendChild(script);

    return () => {
      if (container && script.parentNode) {
        container.removeChild(script);
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, height]);

  return (
    <div 
      ref={containerRef} 
      id={`tradingview-widget-${symbol}`}
      className="rounded-md overflow-hidden border"
      data-testid="tradingview-widget"
    />
  );
}
