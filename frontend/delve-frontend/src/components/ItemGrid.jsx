const ItemGrid = ({ data, renderItem, emptyMessage = "No items found." }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((item, index) => renderItem(item, index))}
    </div>
  );
};

export default ItemGrid;
