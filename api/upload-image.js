export default async function handler(req, res) {
  // Disabled before public launch: public repo writes are too risky for this MVP.
  return res.status(404).json({ error: 'Not found' });
}
