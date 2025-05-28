import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";

const JobsTable = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
  const [showModal, setShowModal] = useState(false);
  const [proposalContent, setProposalContent] = useState("");

  const handleGenerate = async (job) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const token = await user.getIdToken();

      const res = await fetch("http://localhost:3000/generate-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(job),
      });

      console.log(res);
      const data = await res.json();

      if (res.ok) {
        setProposalContent(data.proposal);
        setShowModal(true);
      } else {
        alert("Failed to generate proposal.");
      }
    } catch (err) {
      console.error("Error generating proposal:", err);
      alert("Authentication or proposal generation failed.");
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const token = await user.getIdToken();

        const res = await fetch("http://localhost:3000/jobs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Network response was not ok");

        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load job data");
      }
    };

    fetchJobs();
  }, []);

  const totalPages = Math.ceil(data.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentJobs = data.slice(startIndex, startIndex + entriesPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {error && <p className="text-red-500">{error}</p>}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-4">
          <div className="bg-white max-w-2xl w-full p-6 rounded-lg shadow-lg space-y-4 relative">
            <h2 className="text-lg font-semibold text-gray-800">
              Generated Proposal
            </h2>
            <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-[60vh] overflow-y-auto border p-3 rounded bg-gray-50">
              {proposalContent}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {data.length > 0 ? (
        <>
          <div className="rounded-lg border border-gray-300 shadow-sm max-h-[80vh] overflow-y-auto">
            <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
              <thead className="sticky top-0 z-10 bg-gray-100">
                <tr>
                  {[
                    "date",
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
                      className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold capitalize text-gray-700 bg-gray-100"
                    >
                      {header}
                    </th>
                  ))}
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold capitalize text-gray-700 bg-gray-100">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentJobs.map((row, idx) => (
                  <React.Fragment key={startIndex + idx}>
                    <tr className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-4 py-2">
                        {row.date}
                      </td>
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
                          className={`px-3 py-1 rounded text-white text-sm font-medium transition ${
                            row.matchesInDescription === "Yes"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-gray-400 cursor-not-allowed"
                          }`}
                          onClick={() => handleGenerate(row)}
                        >
                          {row.proposal && row.proposal.trim().length > 0
                            ? "View Proposal"
                            : "Generate Proposal"}
                        </button>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={10}
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

          {/* Pagination Controls */}
          <div className="mt-4 flex justify-center items-center space-x-2 text-sm">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Previous
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-blue-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        !error && <p className="text-gray-500">Loading...</p>
      )}
    </div>
  );
};

export default JobsTable;
