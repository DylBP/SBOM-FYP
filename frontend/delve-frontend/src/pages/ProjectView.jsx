import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";

const ProjectView = () => {
  const { projectId } = useParams();
  const [sboms, setSboms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchSboms = async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/sboms`);
      setSboms(res.data);
    } catch (err) {
      console.error("Failed to fetch SBOMs for project:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSboms();
  }, [projectId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!file) {
      setMessage("⚠️ Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    try {
      setUploading(true);
      await axios.post(`/api/uploadSBOM`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("✅ Upload successful!");
      setFile(null);
      fetchSboms(); // refresh the list
    } catch (error) {
      console.error("Upload failed", error);
      setMessage("❌ Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col pt-20 px-6 py-12 bg-gray-100 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Project: {projectId}
          </h1>

          {/* Upload Form */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-10 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Upload SBOM to this Project
            </h2>
            <form onSubmit={handleUpload}>
              <input
                type="file"
                accept=".spdx,.json,.xml"
                onChange={(e) => setFile(e.target.files[0])}
                required
                className="block w-full border px-3 py-2 rounded mb-4"
              />
              <div className="flex gap-4 items-center">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                >
                  {uploading ? "Uploading..." : "Upload SBOM"}
                </button>
                {message && (
                  <p
                    className={`text-sm font-medium ${
                      message.includes("failed") || message.includes("⚠️")
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* SBOM List */}
          {loading ? (
            <p className="text-center text-gray-600">Loading SBOMs...</p>
          ) : sboms.length === 0 ? (
            <p className="text-center text-gray-500">
              No SBOMs uploaded for this project yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sboms.map((sbom) => (
                <div
                  key={sbom.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border border-gray-200"
                >
                  <h2 className="text-xl font-semibold text-indigo-700 break-words">
                    {sbom.name || "Unnamed SBOM"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Created:{" "}
                    {sbom.createdAt
                      ? new Date(sbom.createdAt).toLocaleString()
                      : "Unknown"}
                  </p>
                  <Link
                    to={`/sbom/${sbom.id}`}
                    className="inline-block mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectView;
