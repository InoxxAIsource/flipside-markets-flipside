import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '@/hooks/use-theme';

let idCounter = 0;
const generateUniqueId = () => `mermaid-diagram-${idCounter++}`;

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    curve: 'linear',
    padding: 20,
  },
  sequence: {
    actorMargin: 50,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
  },
});

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const idRef = useRef(generateUniqueId());
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    let active = true;

    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Update mermaid theme based on current theme
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
          flowchart: {
            curve: 'linear',
            padding: 20,
          },
          sequence: {
            actorMargin: 50,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
          },
        });

        const { svg } = await mermaid.render(idRef.current, chart);
        
        if (active && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (active) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
          setError(errorMessage);
          console.error('Mermaid render error:', err);
        }
      }
    };

    renderDiagram();

    return () => {
      active = false;
    };
  }, [chart, theme]);

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
        <p className="text-sm text-destructive">
          <strong>Diagram Error:</strong> {error}
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`mermaid-container ${className}`}
      data-testid="mermaid-diagram"
    />
  );
}
