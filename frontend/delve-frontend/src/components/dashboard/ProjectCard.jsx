import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axios";
import cache from "../../lib/cache";

const ProjectCard = ({ project, onProjectUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name || "",
    description: project.description || "",
    tags: Array.isArray(project.tags) ? project.tags.join(", ") : "",
  });
  const [error, setError] = useState("");

  const handleSave = async () => {
    try {
      const updatedProject = {
        ...project,
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      await axios.put(`/api/projects/${project.projectId}`, updatedProject);

      const updatedProjects = (cache.getProjects() || []).map((p) =>
        p.projectId === project.projectId ? updatedProject : p
      );
      cache.setProjects(updatedProjects);
      onProjectUpdate(updatedProjects);

      setEditing(false);
    } catch (err) {
      console.error("Failed to update project:", err);
      setError("Failed to save changes.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border border-gray-200">
      {editing ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-700">Edit Project</h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Project Name</label>
            <input
              className="w-full border px-3 py-2 rounded text-sm focus:ring focus:ring-indigo-200"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Project name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="w-full border px-3 py-2 rounded text-sm focus:ring focus:ring-indigo-200"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Project description"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            <input
              className="w-full border px-3 py-2 rounded text-sm focus:ring focus:ring-indigo-200"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Comma-separated tags"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setEditing(false)}
              className="text-sm px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-sm px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
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

          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {project.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <Link
              to={`/projects/${project.projectId}`}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              View SBOMs →
            </Link>
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-gray-500 hover:underline"
            >
              Edit
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectCard;
