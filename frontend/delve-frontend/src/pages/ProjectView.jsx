import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../api/axios";
import SBOMCard from "../components/projectView/SBOMCard";
import ItemGrid from "../components/ItemGrid";
import cache from "../lib/cache";

const ProjectView = () => {
  const { projectId } = useParams();
  const [projectName, setProjectName] = useState("");
  const [sboms, setSboms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProjectName = () => {
    const projects = cache.getProjects();
    const found = projects?.find(p => p.projectId === projectId);
    setProjectName(found ? found.name : projectId);
  };

  const fetchSboms = async () => {
    const cached = cache.getSboms(projectId);
    if (cached) {
      setSboms(cached);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`/api/projects/${projectId}/sboms`);
      cache.setSboms(projectId, res.data);
      setSboms(res.data);
    } catch (err) {
      console.error("Failed to fetch SBOMs for project:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectName();
      fetchSboms();
    }
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
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      setMessage("✅ Upload successful!");
      setFile(null);
  
      const existingSboms = cache.getSboms(projectId) || [];
      await Promise.all(
        existingSboms.map(sbom => cache.clearParsed(sbom.id))
      );
      
      cache.clearSboms(projectId);
  
      await fetchSboms();
  
      const latestSboms = cache.getSboms(projectId) || [];
      await Promise.all(
        latestSboms.map(async (sbom) => {
          try {
            const parsed = await axios.get(`/api/${sbom.id}/parsed`);
            await cache.setParsed(sbom.id, parsed.data);
          } catch (err) {
            console.warn(`Failed to fetch parsed for ${sbom.id}`, err);
          }
        })
      );
  
    } catch (error) {
      console.error("Upload failed", error);
      setMessage("❌ Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col pt-20 px-6 py-12 bg-gray-100 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Project: {projectName}
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
                  className={`text-sm font-medium ${message.includes("failed") || message.includes("⚠️")
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

        {/* SBOM Grid */}
        {loading ? (
          <p className="text-center text-gray-600">Loading SBOMs...</p>
        ) : (
          <ItemGrid
            data={sboms}
            renderItem={(sbom) => <SBOMCard key={sbom.id} sbom={sbom} />}
            emptyMessage="No SBOMs uploaded for this project yet."
          />
        )}
      </div>
    </div>
  );
};

export default ProjectView;
