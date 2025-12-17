import User from "@/models/User";
import connectToDatabase from "@/lib/db";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";
import { financialScore } from "@/lib/financial-score";
import mongoose from "mongoose";
import { model } from "@/lib/gemini";

export interface StorySlide {
    id: string;
    type: 'overview' | 'top_category' | 'trend' | 'health' | 'insight';
    title: string;
    value: string;
    subtext: string;
    color: string; // Gradient class
    icon?: string;
}

export const storiesGenerator = {
    generate: async (userId: string): Promise<StorySlide[]> => {
        try {
            await connectToDatabase();
            const now = new Date();
            const start = startOfMonth(now);
            const userObjectId = new mongoose.Types.ObjectId(userId);

            // 1. Fetch Data for Context
            const currentMonthStats = await User.aggregate([
                { $match: { _id: userObjectId } },
                { $unwind: "$transactions" },
                { $match: { "transactions.type": 'expense', "transactions.date": { $gte: start } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$transactions.amount" },
                        categories: { $push: { category: "$transactions.category", amount: "$transactions.amount" } },
                        txs: { $push: { desc: "$transactions.description", amount: "$transactions.amount", date: "$transactions.date" } }
                    }
                }
            ]);

            const scoreData = await financialScore.calculate(userId);
            const stats = currentMonthStats[0] || { total: 0, categories: [], txs: [] };

            // If no data, return static "Welcome" stories
            if (stats.total === 0) {
                return [{
                    id: 'welcome',
                    type: 'overview',
                    title: 'Fresh Start',
                    value: '₹0',
                    subtext: 'No spending yet this month!',
                    color: 'from-blue-500 to-cyan-500',
                    icon: 'sun'
                }];
            }

            // 2. Prompt Gemini for Creative Stories
            const prompt = `
            You are a witty and insightful financial assistant.
            Analyze this user's spending data for the current month and generate 3-4 engaging "Story Slides" (like Instagram/Snapchat stories).

            **User Data:**
            - Total Spent: ₹${stats.total}
            - Financial Health Score: ${scoreData?.score || 'N/A'}
            - Top Categories: ${JSON.stringify(stats.categories.slice(0, 10))}
            - Recent Transactions: ${JSON.stringify(stats.txs.slice(0, 5))}

            **Requirements:**
            - Generate a JSON array of objects with the following schema:
              {
                "id": "unique_string",
                "type": "one of ['overview', 'top_category', 'trend', 'health', 'insight']",
                "title": "Short catchy title (max 20 chars)",
                "value": "Main stat to show (e.g. ₹5,000 or 'Coffee Addict')",
                "subtext": "Witty 1-line comment or insight (max 40 chars)",
                "color": "Tailwind gradient classes (e.g. 'from-purple-500 to-pink-500')",
                "icon": "Lucide icon name (e.g. 'coffee', 'trending-up', 'alert-triangle', 'award')"
              }
            - Make the content personalized. If they spent a lot on food, crack a joke about it. If they saved, congratulate them.
            - Ensure the 'color' gradients look premium and varied.
            - STRICTLY return only the JSON array. No markdown code blocks.
            `;

            const result = await model.generateContent(prompt);
            const response = result.response.text();

            // Clean up code blocks if Gemini sends them
            const cleanedResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();

            const slides: StorySlide[] = JSON.parse(cleanedResponse);
            return slides;

        } catch (error) {
            console.error("Error generating AI stories:", error);
            // Fallback to basic static stories from the previous implementation if AI fails
            return [
                {
                    id: 'error_fallback',
                    type: 'overview',
                    title: 'Monthly Overview',
                    value: 'Check Back Later',
                    subtext: 'AI is taking a nap',
                    color: 'from-gray-500 to-slate-600',
                    icon: 'loader'
                }
            ];
        }
    }
};
