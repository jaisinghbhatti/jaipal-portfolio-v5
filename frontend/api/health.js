export default function handler(req, res) {
  res.status(200).json({ status: 'healthy', service: 'resume-builder', runtime: 'vercel-edge' });
}
