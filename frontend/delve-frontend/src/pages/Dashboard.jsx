import { useEffect, useState } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import ProjectCard from "../components/dashboard/ProjectCard";
import NewProjectCard from "../components/dashboard/NewProjectCard";
import ItemGrid from "../components/ItemGrid";
import cache from "../lib/cache";
import { v4 as uuidv4 } from "uuid";


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
    const cached = cache.getProjects();
    if (cached) {
      setProjects(cached);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("/api/projects");
      cache.setProjects(res.data);
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      projectId: uuidv4(),
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      tags: newProject.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    try {
      await axios.post("/api/projects", payload);
      setNewProject({ projectId: "", name: "", description: "", tags: "" });
      setCreating(false);

      cache.clearProjects();
      await fetchProjects();
    } catch (err) {
      console.error("Failed to create project:", err);
      setError(err.response?.data?.message || "Failed to create project.");
    }
  };

  return (
    <>
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-20 px-6 py-12 bg-gray-100 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-5xl space-y-8">
          <h1 className="text-3xl font-bold text-gray-800 text-center">Your Projects</h1>

          {loading ? (
            <p className="text-center text-gray-600">Loading...</p>
          ) : (
            <ItemGrid
              data={[...projects, "__NEW_PROJECT__"]}
              renderItem={(item) =>
                item === "__NEW_PROJECT__" ? (
                  <NewProjectCard
                    key="new-project"
                    creating={creating}
                    setCreating={setCreating}
                    newProject={newProject}
                    setNewProject={setNewProject}
                    handleCreateProject={handleCreateProject}
                    error={error}
                  />
                ) : (
                  <ProjectCard 
                    key={item.projectId}
                    project={item}
                    onProjectUpdate={setProjects} />
                )
              }
              emptyMessage="You have no projects yet."
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
