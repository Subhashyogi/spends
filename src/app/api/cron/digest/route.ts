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

        const today = new Date();
        const isFirstDay = today.getDate() === 1;

        if (!isFirstDay && !force) {
            return NextResponse.json({ message: 'Not the 1st of the month', skipped: true });
        }

        // Determine report types to send
        const reportsToSend: Array<'monthly' | 'yearly'> = ['monthly'];

        // If it's Jan 1st, also send yearly report
        if ((today.getMonth() === 0 && isFirstDay) || (force && searchParams.get('type') === 'yearly')) {
            reportsToSend.push('yearly');
        }

        const users = await User.find({});
        const results = [];

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

            for (const reportType of reportsToSend) {
                try {
                    let startDate: Date;
                    let endDate: Date;
                    let lastSentField: string;

                    if (reportType === 'monthly') {
                        // Previous month
                        // If today is Dec 1st, we want Nov 1st to Nov 30th
                        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                        endDate = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
                        lastSentField = 'lastMonthlyDigestSent';
                    } else {
                        // Previous year
                        // If today is Jan 1st 2026, we want Jan 1st 2025 to Dec 31st 2025
                        startDate = new Date(today.getFullYear() - 1, 0, 1);
                        endDate = new Date(today.getFullYear() - 1, 11, 31);
                        lastSentField = 'lastYearlyDigestSent';
                    }

                    // Check if already sent (per user & type)
                    if ((user as any)[lastSentField] && !force) {
                        const lastSent = new Date((user as any)[lastSentField]);
                        // For monthly: check if sent this month
                        // For yearly: check if sent this year
                        if (lastSent.getMonth() === today.getMonth() && lastSent.getFullYear() === today.getFullYear()) {
                            results.push({ email: user.email, type: reportType, status: 'skipped', reason: 'already_sent' });
                            continue;
                        }
                    }

                    const pipeline = [
                        { $match: { _id: user._id } },
                        { $unwind: '$transactions' },
                        {
                            $match: {
                                'transactions.date': { $gte: startDate, $lte: endDate },
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
                            type: reportType,
                            totalSpend,
                            topExpenses,
                            upcomingBills,
                            aiTip
                        }));

                        await transporter.sendMail({
                            from: process.env.EMAIL_USER,
                            to: user.email,
                            subject: `Your ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Financial Digest`,
                            html: emailHtml,
                        });

                        // Update last sent date
                        await User.findByIdAndUpdate(user._id, { [lastSentField]: today });
                        results.push({ email: user.email, type: reportType, status: 'sent' });
                    } else {
                        results.push({ email: user.email, type: reportType, status: 'skipped', reason: 'no_activity' });
                    }
                } catch (err: any) {
                    console.error(`Failed to process user ${user.email} for ${reportType}:`, err);
                    results.push({ email: user.email, type: reportType, status: 'failed', error: err.message });
                }
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("Digest Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
