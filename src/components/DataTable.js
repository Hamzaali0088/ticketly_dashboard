export default function DataTable({ columns = [], children }) {
  return (
    <div className="data-table-wrapper bg-[#1F1F1F] border border-[#374151] rounded-xl overflow-hidden max-w-full w-full block min-w-0">
      <div className="data-table-scroll-container overflow-x-auto overflow-y-auto h-[calc(100vh-200px)] max-w-full block min-w-0">
        <table className="w-full table-fixed min-w-[800px]">
          <thead className="bg-[#2A2A2A] sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#374151] relative [&_td]:overflow-hidden [&_td]:text-ellipsis [&_td]:whitespace-nowrap">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}


