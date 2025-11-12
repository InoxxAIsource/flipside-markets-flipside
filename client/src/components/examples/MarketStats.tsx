import { MarketStats } from '../MarketStats';

export default function MarketStatsExample() {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <MarketStats 
        volume={125000} 
        liquidity={50000}
        traders={342}
        activity={1247}
      />
    </div>
  );
}
