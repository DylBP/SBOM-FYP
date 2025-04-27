const SBOMStatisticsTable = ({ projects, getSboms }) => {

    const getLatestSbom = (sboms) => {
        if (!Array.isArray(sboms) || sboms.length === 0) return null;

        return sboms.reduce((latest, current) => {
            const latestTime = new Date(latest.createdAt).getTime();
            const currentTime = new Date(current.createdAt).getTime();
            return currentTime > latestTime ? current : latest;
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="table-auto w-full text-left text-sm text-gray-800 border-collapse">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 border">Project</th>
                        <th className="px-4 py-2 border">SBOM Created</th>
                        <th className="px-4 py-2 border text-center">Low</th>
                        <th className="px-4 py-2 border text-center">Medium</th>
                        <th className="px-4 py-2 border text-center">High</th>
                        <th className="px-4 py-2 border text-center">Critical</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project) => {
                        const id = project.projectId || project.id;
                        const sboms = getSboms(id);
                        const latestSbom = getLatestSbom(sboms);

                        if (!latestSbom || !latestSbom.vulnReport) return null;

                        const severityCounts = latestSbom.vulnReport.severityCounts || {};
                        const counts = {
                            LOW: severityCounts.low || 0,
                            MEDIUM: severityCounts.medium || 0,
                            HIGH: severityCounts.high || 0,
                            CRITICAL: severityCounts.critical || 0,
                        };

                        const createdDate = latestSbom.createdAt
                            ? new Date(latestSbom.createdAt).toLocaleString()
                            : "Unknown";

                        return (
                            <tr key={id} className="border-t">
                                <td className="px-4 py-2 border font-medium">{project.name}</td>
                                <td className="px-4 py-2 border">{createdDate}</td>
                                <td className="px-4 py-2 border text-center">{counts.LOW}</td>
                                <td className="px-4 py-2 border text-center">{counts.MEDIUM}</td>
                                <td className="px-4 py-2 border text-center">{counts.HIGH}</td>
                                <td className="px-4 py-2 border text-center">{counts.CRITICAL}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default SBOMStatisticsTable;
