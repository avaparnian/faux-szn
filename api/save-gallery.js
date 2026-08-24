import { put } from "@vercel/blob";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const gallery = req.body;

        await put("gallery.json", JSON.stringify(gallery), {
            access: "public",
            contentType: "application/json",
            allowOverwrite: true,
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to save gallery" });
    }
}