export default function TableSkeleton({
  columns = 6,
  rows = 5,
}) {
  const cols = Array.from({ length: columns });
  const rws = Array.from({ length: rows });

  return (
    <>
      {rws.map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse">
          {cols.map((_, cIdx) => (
            <td key={cIdx} className="px-6 py-[26px]">
              <div className="h-4 w-full max-w-xs bg-gray-700 rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}


