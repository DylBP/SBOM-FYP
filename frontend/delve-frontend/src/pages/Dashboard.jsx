import { useEffect, useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    projectId: "",
    name: "",
    description: "",
    tags: ""
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/api/projects");
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError("");
  
    const payload = {
      projectId: newProject.projectId.trim(),
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      tags: newProject.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
  
    try {
      await axios.post("/api/projects", payload);
      setNewProject({ projectId: "", name: "", description: "", tags: "" });
      setCreating(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create project.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col pt-20 px-6 py-12 bg-gray-100 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-5xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Your Projects</h1>

          {loading ? (
            <p className="text-center text-gray-600">Loading...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.projectId}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border border-gray-200"
                >
                  <h2 className="text-xl font-semibold text-indigo-700 break-words">
                    {project.name || "Unnamed Project"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Created:{" "}
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleString()
                      : "Unknown"}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {project.description || "No description"}
                  </p>
                  <Link
                    to={`/projects/${project.projectId}`}
                    className="inline-block mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    View SBOMs →
                  </Link>
                </div>
              ))}

              {/* New Project Card */}
              <div className="bg-white p-6 rounded-lg shadow border border-dashed border-indigo-400 hover:shadow-md transition flex flex-col justify-center items-center text-center">
                {!creating ? (
                  <button
                    onClick={() => setCreating(true)}
                    className="text-indigo-600 font-semibold hover:text-indigo-700 text-lg"
                  >
                    ➕ Create New Project
                  </button>
                ) : (
                  <form onSubmit={handleCreateProject} className="w-full space-y-4">
                    <input
                      type="text"
                      placeholder="Project ID (unique)"
                      value={newProject.projectId}
                      onChange={(e) =>
                        setNewProject({ ...newProject, projectId: e.target.value })
                      }
                      required
                      className="w-full border px-3 py-2 rounded text-sm"
                    />

                    <input
                      type="text"
                      placeholder="Project Name"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                      required
                      className="w-full border px-3 py-2 rounded text-sm"
                    />

                    <textarea
                      placeholder="Optional description"
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({ ...newProject, description: e.target.value })
                      }
                      rows="2"
                      className="w-full border px-3 py-2 rounded text-sm"
                    />

                    <input
                      type="text"
                      placeholder="Tags (comma-separated)"
                      value={newProject.tags}
                      onChange={(e) =>
                        setNewProject({ ...newProject, tags: e.target.value })
                      }
                      className="w-full border px-3 py-2 rounded text-sm"
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="flex justify-between gap-2">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm w-full"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreating(false)}
                        className="border border-gray-300 px-4 py-2 rounded text-sm w-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
