import { PriceChart } from '../PriceChart';

export default function PriceChartExample() {
  return (
    <div className="w-full max-w-2xl p-4 bg-card rounded-lg">
      <h3 className="text-sm font-medium mb-4">Price History</h3>
      <PriceChart height={300} />
    </div>
  );
}
