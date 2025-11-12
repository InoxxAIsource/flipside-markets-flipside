import { CreateMarketForm } from '../CreateMarketForm';

export default function CreateMarketFormExample() {
  return (
    <div className="p-4">
      <CreateMarketForm onSubmit={(data) => console.log('Form submitted:', data)} />
    </div>
  );
}
