import { Link } from "react-router-dom";

const SBOMCard = ({ sbom }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border border-gray-200">
      <h2 className="text-xl font-semibold text-indigo-700 break-words">
        {sbom.name || "Unnamed SBOM"}
      </h2>
      <p className="text-sm text-gray-500 mt-2">
        Created: {sbom.createdAt ? new Date(sbom.createdAt).toLocaleString() : "Unknown"}
      </p>
      <Link
        to={`/sbom/${sbom.id}`}
        className="inline-block mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
      >
        View Details →
      </Link>
    </div>
  );
};

export default SBOMCard;
