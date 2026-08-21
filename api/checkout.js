import Stripe from "stripe";
import { list } from "@vercel/blob";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { items } = req.body;   // [{ id, size }, ...] — sent from the cart

        if (!items || items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        // fetch real listings so prices are never trusted from the browser
        const { blobs } = await list({ prefix: "listings.json" });
        const response = await fetch(blobs[0].url);
        const listings = await response.json();

        const line_items = items.map(cartItem => {
            const product = listings.find(l => l.id === cartItem.id);
            if (!product) throw new Error(`Product not found: ${cartItem.id}`);

            return {
                price_data: {
                    currency: "aud",
                    product_data: {
                        name: `${product.name} (${cartItem.size})`,
                        images: [product.images[0]],
                    },
                    unit_amount: product.price,
                },
                quantity: 1,
            };
        });

        // flat shipping fee
        line_items.push({
            price_data: {
                currency: "aud",
                product_data: { name: "Shipping" },
                unit_amount: 1500,
            },
            quantity: 1,
        });

        const origin = req.headers.origin || "https://faux-szn.vercel.app";

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items,
            success_url: `${origin}/confirmation.html`,
            cancel_url: `${origin}/`,
        });

        return res.status(200).json({ url: session.url });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Checkout failed" });
    }
}