const { createProject } = require('../services/dynamoService');

async function handleCreateProject(req, res) {
  const { projectId, name, description, tags } = req.body;
  const userId = req.user.sub;

  if (!projectId || !name) {
    return res.status(400).json({ error: "projectId and name are required" });
  }

  try {
    await createProject(userId, projectId, name, description, tags || []);
    res.status(201).json({ message: `Project '${projectId}' created successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { handleCreateProject };