import { useEffect, useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  const [sboms, setSboms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSboms = async () => {
      try {
        const response = await axios.get('/api/my-sboms');  // 🛑 <-- UPDATE with your real API endpoint if different
        setSboms(response.data);  // assume backend returns an array
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
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Your SBOM Files</h1>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sboms.map((sbom) => (
              <div key={sbom.id} className="border p-4 rounded shadow hover:shadow-lg transition">
                <h2 className="text-xl font-semibold">{sbom.name || "Unnamed SBOM"}</h2>
                <p className="text-gray-600">Uploaded on: {sbom.createdAt || "Unknown date"}</p>
                <a href={`/sbom/${sbom.id}`} className="text-blue-500 underline mt-2 inline-block">
                  View Details
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
