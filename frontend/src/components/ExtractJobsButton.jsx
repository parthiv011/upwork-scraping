import { useState } from "react";
import { getAuth } from "firebase/auth";

const keywordOptions = [
  "aws",
  "generative ai",
  "agentic ai",
  "ai agent",
  "gcp",
  "azure",
  "amazon",
  "bot",
  "cloud computing",
  "crm",
  "erp",
  "database",
  "devops",
  "flutter",
  "microsoft dynamics",
  "microsoft d365",
  "power bi",
  "pytorch",
  "react.js",
  "react native",
  "raspberry pi",
  "shopify",
  "salesforce",
  "sql",
  "machine learning",
  "erpnext",
  "odoo",
  "data science",
  "data analytics",
  "MLOps",
  "node.js",
  "custom api",
  "Natural Language Processing",
  "computer vision",
  "Artificial Neural Networks",
  "LangChain",
  "kubernetes",
  "docker",
  "orm",
];

const ExtractJobsButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [pages, setPages] = useState(2);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const toggleKeyword = (keyword) => {
    setSelectedKeywords((prev) => {
      if (prev.includes(keyword)) return prev.filter((k) => k !== keyword);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, keyword];
    });
  };

  const handleExtract = async () => {
    if (selectedKeywords.length < 1 || selectedKeywords.length > 3) {
      setFeedback("Please select between 1 to 3 keywords.");
      return;
    }

    setLoading(true);
    setFeedback("");

    const query = new URLSearchParams({
      keywords: selectedKeywords.join(","),
      pages: pages.toString(),
    }).toString();

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const token = await user.getIdToken();

      const res = await fetch(`http://localhost:3000/extract-jobs?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to extract jobs");

      setFeedback("✅ Job extraction started successfully!");
    } catch (err) {
      console.error("❌ Error during extraction:", err);
      setFeedback("❌ Failed to extract jobs.");
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <button
        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
        onClick={() => setShowModal(true)}
      >
        Extract Jobs
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg space-y-4">
            <h3 className="text-lg font-semibold">Extract Jobs</h3>

            <div>
              <label className="text-sm font-medium block mb-1">
                Select Keywords (1–3)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                {keywordOptions.map((keyword) => (
                  <label
                    key={keyword}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      value={keyword}
                      checked={selectedKeywords.includes(keyword)}
                      onChange={() => toggleKeyword(keyword)}
                      disabled={
                        !selectedKeywords.includes(keyword) &&
                        selectedKeywords.length >= 3
                      }
                    />
                    <span>{keyword}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Number of Pages
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="w-full border border-gray-300 px-3 py-2 rounded"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExtract}
                disabled={loading}
                className={`px-3 py-1 rounded text-white ${
                  loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Extracting..." : "Start"}
              </button>
            </div>

            {feedback && <p className="text-sm text-gray-600">{feedback}</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default ExtractJobsButton;
