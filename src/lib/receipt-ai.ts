import Transaction from "@/models/Transaction";
import connectToDatabase from "@/lib/db";
import { startOfMonth, subMonths } from "date-fns";

export const receiptAI = {
    // 1. Text Parser (Mock OCR)
    parseReceiptText: (text: string) => {
        // Expected format: "Item Name Price Qty(opt)"
        // e.g., "Milk 50 2" or "Milk 50"
        const lines = text.split('\n');
        const items: any[] = [];

        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            // Heuristic: Last part is price or qty?
            // If last 2 parts are numbers: Name Price Qty
            // If last 1 part is number: Name Price (Qty=1)

            if (parts.length >= 2) {
                const last = parseFloat(parts[parts.length - 1]);
                const secondLast = parseFloat(parts[parts.length - 2]);

                if (!isNaN(last) && !isNaN(secondLast)) {
                    // "Milk 50 2" -> Price=50, Qty=2
                    const name = parts.slice(0, parts.length - 2).join(' ');
                    items.push({ name, price: secondLast, qty: last });
                } else if (!isNaN(last)) {
                    // "Milk 50" -> Price=50, Qty=1
                    const name = parts.slice(0, parts.length - 1).join(' ');
                    items.push({ name, price: last, qty: 1 });
                }
            }
        });
        return items;
    },

    // 2. Intelligence Engine
    analyzeItems: async (userId: string, newItems: any[]) => {
        await connectToDatabase();
        const start = startOfMonth(subMonths(new Date(), 6)); // 6 month history

        const insights: string[] = [];

        // Fetch history for these items
        const itemNames = newItems.map(i => new RegExp(i.name, 'i'));
        const history = await Transaction.find({
            userId,
            'items.name': { $in: itemNames },
            date: { $gte: start },
            type: 'expense'
        });

        // Analyze specific chunks
        for (const item of newItems) {
            // Filter history for this specific item
            const relevantTxs = history.filter(tx =>
                tx.items?.some((i: any) => i.name.toLowerCase() === item.name.toLowerCase())
            );

            if (relevantTxs.length > 0) {
                let totalQty = 0;
                let totalPrice = 0;
                let count = 0;

                relevantTxs.forEach(tx => {
                    const match = tx.items.find((i: any) => i.name.toLowerCase() === item.name.toLowerCase());
                    if (match) {
                        totalQty += (match.qty || 1);
                        totalPrice += (match.price || 0);
                        count++;
                    }
                });

                const avgQty = totalQty / count;
                const avgPrice = totalPrice / count;

                // Rule 1: Bulk Buying Warning
                if (item.qty > avgQty * 2 && item.qty >= 3) {
                    insights.push(`You bought ${item.qty} ${item.name}s. You usually buy ${Math.round(avgQty)}. Stocking up?`);
                }

                // Rule 2: Price Hike Warning
                if (item.price > avgPrice * 1.25) {
                    insights.push(`You paid ₹${item.price} for ${item.name}, which is 25% more than your average (₹${Math.round(avgPrice)}).`);
                }
            }
        }

        return insights;
    }
};
