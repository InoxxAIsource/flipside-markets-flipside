import { CategoryFilter } from '../CategoryFilter';
import { useState } from 'react';

export default function CategoryFilterExample() {
  const [selected, setSelected] = useState('all');
  
  return (
    <div className="p-4">
      <CategoryFilter 
        selected={selected}
        onSelect={(cat) => {
          setSelected(cat);
          console.log('Selected category:', cat);
        }}
      />
    </div>
  );
}
