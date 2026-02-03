export default function DataTable({ columns = [], children }) {
  return (
    <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl w-full max-w-full">
      
      {/* Scroll container */}
      <div className="overflow-x-auto overflow-y-auto h-[calc(100vh-200px)] w-full">
        
        {/* Content-sized table */}
        <table className="table-auto w-max min-w-full border-collapse">
          
          <thead className="bg-[#2A2A2A] sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#374151]">
            {children}
          </tbody>

        </table>

      </div>
    </div>
  );
}
