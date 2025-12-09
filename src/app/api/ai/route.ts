// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { aiTools } from "@/lib/ai-tools";

// Helper to extract date range from text
const extractDateRange = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes("today")) return "today";
    if (t.includes("yesterday")) return "yesterday";
    if (t.includes("this week")) return "this_week";
    if (t.includes("last week")) return "last_week";
    if (t.includes("this month")) return "this_month";
    if (t.includes("last month")) return "last_month";
    if (t.includes("this year")) return "this_year";
    if (t.includes("last year")) return "last_year";
    if (t.includes("3 months")) return "last_3_months";
    if (t.includes("6 months")) return "last_6_months";
    return "this_month"; // Default
};

// Helper to extract category (naive implementation)
const extractCategory = (text: string) => {
    const commonCategories = ["food", "transport", "shopping", "entertainment", "bills", "utilities", "rent", "salary", "income", "groceries", "health", "travel"];
    const t = text.toLowerCase();
    return commonCategories.find(c => t.includes(c)) || null;
};

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message } = await req.json();
        const userId = session.user.email;
        const lowerMsg = message.toLowerCase();

        let responseText = "I'm not sure I understand. Try asking about your spending, recent transactions, or for a chart.";
        let chartData = null;

        // --- INTENT DETECTION ---

        // 1. TOTAL SPENDING
        if (lowerMsg.includes("spend") || lowerMsg.includes("spent") || lowerMsg.includes("total") || lowerMsg.includes("how much")) {
            const dateRange = extractDateRange(lowerMsg);
            const category = extractCategory(lowerMsg);

            const data = await aiTools.getTotalSpent(userId, { category, dateRange });

            const periodText = dateRange.replace("_", " ");
            if (category) {
                responseText = `You spent ₹${data.total.toLocaleString()} on **${category}** during ${periodText}.`;
            } else {
                responseText = `Your total spending for ${periodText} is ₹${data.total.toLocaleString()}.`;
            }
        }

        // 2. RECENT TRANSACTIONS
        else if (lowerMsg.includes("transaction") || lowerMsg.includes("history") || lowerMsg.includes("recent") || lowerMsg.includes("list")) {
            const dateRange = extractDateRange(lowerMsg);
            const category = extractCategory(lowerMsg);
            const limit = lowerMsg.includes("last 10") ? 10 : 5;

            const txs = await aiTools.getTransactions(userId, { limit, category, dateRange });

            if (txs.length === 0) {
                responseText = `I couldn't find any transactions for ${dateRange.replace("_", " ")}.`;
            } else {
                responseText = `Here are your recent transactions:\n`;
                txs.forEach((t: any) => {
                    responseText += `- **${t.category || 'General'}**: ₹${t.amount} (${new Date(t.date).toLocaleDateString()})\n`;
                });
            }
        }

        // 3. BIGGEST EXPENSE
        else if (lowerMsg.includes("biggest") || lowerMsg.includes("highest") || lowerMsg.includes("most expensive") || lowerMsg.includes("top category")) {
            const dateRange = extractDateRange(lowerMsg);
            const data = await aiTools.getBiggestCategory(userId, { dateRange });

            if (data) {
                responseText = `Your biggest spending category for ${dateRange.replace("_", " ")} was **${data.category}** with ₹${data.amount.toLocaleString()}.`;
            } else {
                responseText = "You don't have enough data for that period yet.";
            }
        }

        // 4. CHARTS
        else if (lowerMsg.includes("chart") || lowerMsg.includes("graph") || lowerMsg.includes("trend") || lowerMsg.includes("visualize")) {
            const dateRange = extractDateRange(lowerMsg);
            const category = extractCategory(lowerMsg);

            const data = await aiTools.getChartData(userId, { category, dateRange });

            if (data.data.length > 0) {
                responseText = `Here is the spending chart for ${category ? category : "all expenses"} over ${dateRange.replace("_", " ")}.`;
                chartData = data;
            } else {
                responseText = "I couldn't find enough data to generate a chart for that period.";
            }
        }

        // 5. PREDICTION
        else if (lowerMsg.includes("predict") || lowerMsg.includes("forecast") || lowerMsg.includes("next month")) {
            const data = await aiTools.predictNextMonthExpenses(userId);
            responseText = `Based on your last 3 months, I predict you might spend around **₹${data.prediction.toLocaleString()}** next month.`;
        }

        // 6. ADVICE
        else if (lowerMsg.includes("advice") || lowerMsg.includes("tip") || lowerMsg.includes("suggest")) {
            responseText = await aiTools.generateAdvice(userId);
        }

        // 7. GREETING
        else if (lowerMsg.includes("hi") || lowerMsg.includes("hello") || lowerMsg.includes("hey")) {
            responseText = "Hello! I'm your personal finance assistant. Ask me about your spending, check your recent transactions, or ask for a chart!";
        }

        return NextResponse.json({
            text: responseText,
            chart: chartData
        });

    } catch (error: any) {
        console.error("Manual AI Error:", error);
        return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
    }
}
