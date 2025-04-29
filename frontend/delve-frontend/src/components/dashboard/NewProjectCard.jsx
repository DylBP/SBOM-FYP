import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const NewProjectCard = ({
  creating,
  setCreating,
  newProject,
  setNewProject,
  handleCreateProject,
  error,
}) => {
  // Generate a UUID when entering create mode
  useEffect(() => {
    if (creating && !newProject.projectId) {
      setNewProject((prev) => ({ ...prev, projectId: uuidv4() }));
    }
  }, [creating, newProject.projectId, setNewProject]);

  return (
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
  );
};

export default NewProjectCard;
