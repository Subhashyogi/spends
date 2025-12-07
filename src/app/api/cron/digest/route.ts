import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { requireUser } from '@/lib/auth-helpers';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import DigestTemplate from '@/emails/digest-template';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        // Ensure someone is logged in to trigger this, but we'll process all users
        await requireUser();

        const { searchParams } = new URL(req.url);
        const force = searchParams.get('force') === 'true';

        // Check if today is the last day of the month
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // If tomorrow is the 1st of the next month, then today is the last day
        const isLastDay = tomorrow.getDate() === 1;

        if (!isLastDay && !force) {
            return NextResponse.json({ message: 'Not the last day of the month', skipped: true });
        }

        const users = await User.find({});
        const results = [];

        // Configure transporter once
        console.log("Email User present:", !!process.env.EMAIL_USER);
        console.log("Email Pass present:", !!process.env.EMAIL_PASS);

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("Missing email credentials in .env.local");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        for (const user of users) {
            if (!user.email) continue;

            try {
                // Check if already sent this month (per user)
                if (user.lastMonthlyDigestSent && !force) {
                    const lastSent = new Date(user.lastMonthlyDigestSent);
                    if (lastSent.getMonth() === today.getMonth() && lastSent.getFullYear() === today.getFullYear()) {
                        results.push({ email: user.email, status: 'skipped', reason: 'already_sent' });
                        continue;
                    }
                }

                // Calculate stats for the month
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

                const pipeline = [
                    { $match: { _id: user._id } },
                    { $unwind: '$transactions' },
                    {
                        $match: {
                            'transactions.date': { $gte: startOfMonth, $lte: today },
                            'transactions.type': 'expense'
                        }
                    },
                    { $replaceRoot: { newRoot: '$transactions' } }
                ];

                const expenses = await User.aggregate(pipeline);
                const totalSpend = expenses.reduce((acc, curr) => acc + curr.amount, 0);

                const topExpenses = [...expenses]
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 3)
                    .map(e => ({ name: e.description, amount: e.amount, date: e.date }));

                const upcomingBills = user.transactions
                    .filter((t: any) => t.isRecurring)
                    .slice(0, 3)
                    .map((t: any) => ({ name: t.description, amount: t.amount, date: t.date }));

                const tips = [
                    "Review your subscriptions to save money.",
                    "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
                    "Cook at home more often to reduce food expenses.",
                    "Set a savings goal for your next big purchase.",
                    "Track every small expense, they add up!"
                ];
                const aiTip = tips[Math.floor(Math.random() * tips.length)];

                // Only send if there's activity or it's forced
                if (totalSpend > 0 || upcomingBills.length > 0 || force) {
                    const emailHtml = await render(DigestTemplate({
                        userName: user.name || 'User',
                        type: 'monthly',
                        totalSpend,
                        topExpenses,
                        upcomingBills,
                        aiTip
                    }));

                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: user.email,
                        subject: `Your Monthly Financial Digest`,
                        html: emailHtml,
                    });

                    // Update last sent date
                    await User.findByIdAndUpdate(user._id, { lastMonthlyDigestSent: today });
                    results.push({ email: user.email, status: 'sent' });
                } else {
                    results.push({ email: user.email, status: 'skipped', reason: 'no_activity' });
                }
            } catch (err: any) {
                console.error(`Failed to process user ${user.email}:`, err);
                results.push({ email: user.email, status: 'failed', error: err.message });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("Digest Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
