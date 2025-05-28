import React, { useEffect, useState } from "react";

const JobsTable = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/jobs")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setError(null);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Failed to load job data");
      });
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Upwork Automation</h2>
      {error && <p className="text-red-500">{error}</p>}

      {data.length > 0 ? (
        <div className="rounded-lg border border-gray-300 shadow-sm max-h-[80vh] overflow-y-auto">
          <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr>
                {[
                  "title",
                  "clientSpent",
                  "estimatedBudget",
                  "paymentVerified",
                  "techStack",
                  "matchesInDescription",
                  "keyword",
                  "link",
                ].map((header) => (
                  <th
                    key={header}
                    className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold uppercase text-gray-700 bg-gray-100"
                  >
                    {header}
                  </th>
                ))}
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold uppercase text-gray-700 bg-gray-100">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <React.Fragment key={idx}>
                  <tr className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.title}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.clientSpent}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.estimatedBudget}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.paymentVerified}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.techStack}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.matchesInDescription}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.keyword}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-blue-600 underline">
                      <a
                        href={row.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Link
                      </a>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button
                        disabled={row.matchesInDescription !== "Yes"}
                        className={`px-3 py-1 rounded text-white text-sm font-medium transition 
                  ${
                    row.matchesInDescription === "Yes"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                      >
                        Generate Proposal
                      </button>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td
                      colSpan={9}
                      className="border border-gray-300 px-4 py-3 text-gray-700 whitespace-pre-wrap"
                    >
                      <strong className="block text-gray-600 mb-1">
                        Job Description:
                      </strong>
                      {row.jobDescription}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && <p className="text-gray-500">Loading...</p>
      )}
    </div>
  );
};

export default JobsTable;
