export default function DataTable({ columns = [], children }) {
  return (
    <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl overflow-hidden  ">
      <div className="overflow-y-auto overflow-x-auto h-[calc(100vh-200px)]">
        <table className="w-full">
          <thead className="bg-[#2A2A2A] sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#374151] relative">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}


