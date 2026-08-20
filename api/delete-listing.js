import { list, put, del } from "@vercel/blob";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { id } = req.body;

        const { blobs } = await list({ prefix: "listings.json" });
        if (blobs.length === 0) {
            return res.status(200).json({ success: true });
        }

        const response = await fetch(blobs[0].url);
        const listings = await response.json();

        const updated = listings.filter(item => item.id !== id);

        await put("listings.json", JSON.stringify(updated), {
            access: "public",
            contentType: "application/json",
            allowOverwrite: true,
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to delete listing" });
    }
}