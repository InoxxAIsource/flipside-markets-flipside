import { TradingPanel } from '../TradingPanel';

export default function TradingPanelExample() {
  return (
    <div className="max-w-md mx-auto p-4">
      <TradingPanel 
        yesPrice={0.68} 
        noPrice={0.32}
        onTrade={(side, amount) => console.log(`Trade ${side}:`, amount)}
      />
    </div>
  );
}
