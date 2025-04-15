import { useEffect, useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [sboms, setSboms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSboms = async () => {
      try {
        const response = await axios.get('/api/my-sboms');
        setSboms(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSboms();
  }, []);

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col pt-20 px-6 py-12 bg-gray-100 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Your SBOM Files</h1>

          {loading ? (
            <p className="text-center text-gray-600">Loading...</p>
          ) : sboms.length === 0 ? (
            <p className="text-center text-gray-500">No SBOMs uploaded yet.</p>
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
                    Uploaded:{" "}
                    {sbom.createdAt
                      ? new Date(sbom.createdAt).toLocaleString()
                      : "Unknown date"}
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

export default Dashboard;