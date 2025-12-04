import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/db';
import { requireUser } from "../../../lib/auth-helpers";
import mongoose from "mongoose";
import User from "../../../models/User";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const userId = await requireUser();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const matchInner: any = {};
    if (from || to) {
      matchInner.date = {} as any;
      if (from) (matchInner.date as any).$gte = new Date(from);
      if (to) (matchInner.date as any).$lte = new Date(to);
    }

    const pipeline: any[] = [
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$transactions" },
    ];
    if (Object.keys(matchInner).length) {
      pipeline.push({ $match: { "transactions.date": matchInner.date } });
    }
    pipeline.push({
      $group: {
        _id: "$transactions.type",
        total: { $sum: "$transactions.amount" },
      },
    });
    const result = await User.aggregate(pipeline);

    let incomeTotal = 0;
    let expenseTotal = 0;
    for (const r of result) {
      if (r._id === "income") incomeTotal = r.total || 0;
      if (r._id === "expense") expenseTotal = r.total || 0;
    }

    const balance = incomeTotal - expenseTotal;
    return NextResponse.json({ incomeTotal, expenseTotal, balance });
  } catch (err: any) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const error = status === 401 ? "Unauthorized" : "Database error";
    return NextResponse.json(
      { error, message: err?.message || "Unknown error" },
      { status }
    );
  }
}
