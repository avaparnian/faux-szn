import { put } from "@vercel/blob";

export const config = {
    api: { bodyParser: false },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const filename = req.headers["x-filename"] || `image-${Date.now()}`;

        const blob = await put(filename, req, {
            access: "public",
            addRandomSuffix: true,
        });

        return res.status(200).json({ url: blob.url });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Upload failed" });
    }
}