import React, { useEffect, useState } from "react";
import cache from "../lib/cache";
import SBOMStatisticsTable from "../components/statistics/SBOMStatisticsTable";

const Statistics = () => {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const loadedProjects = cache.getProjects() || [];
        setProjects(loadedProjects);
    }, []);

    return (
        <>
            <div className="flex min-h-screen flex-col pt-20 px-6 py-12 bg-gray-100 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-5xl space-y-8">
                    <h1 className="text-3xl font-bold text-gray-800 text-center">
                        Project Statistics
                    </h1>
                    <SBOMStatisticsTable projects={projects} getSboms={cache.getSboms} />
                </div>
            </div>
        </>
    );
};

export default Statistics;
