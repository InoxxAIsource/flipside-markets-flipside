import { TopNav } from '../TopNav';

export default function TopNavExample() {
  return (
    <div className="w-full">
      <TopNav onSearch={(query) => console.log('Search:', query)} />
    </div>
  );
}
