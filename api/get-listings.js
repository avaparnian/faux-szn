import { list } from "@vercel/blob";

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    try {
        const { blobs } = await list({ prefix: "listings.json" });

        if (blobs.length === 0) {
            return res.status(200).json([]);   // no listings saved yet
        }

        const response = await fetch(blobs[0].url);
        const data = await response.json();

        return res.status(200).json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to load listings" });
    }
}