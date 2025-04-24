import { Link } from "react-router-dom";

const ProjectCard = ({ project }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border border-gray-200">
      <h2 className="text-xl font-semibold text-indigo-700 break-words">
        {project.name || "Unnamed Project"}
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        Created: {project.createdAt ? new Date(project.createdAt).toLocaleString() : "Unknown"}
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
  );
};

export default ProjectCard;
