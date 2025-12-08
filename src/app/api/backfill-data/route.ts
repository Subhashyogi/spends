import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

const rawData = [
    {
        "_id": { "$oid": "693332d1f07bf625258f272b" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-05T19:30:25.423Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6933972a105c2ca5797d196d" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T02:38:34.090Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6933b17b30e11b4b03ed5f2e" },
        "action": "CREATE",
        "entity": "TRANSACTION",
        "details": "Created income of 20 for Founded",
        "createdAt": { "$date": "2025-12-06T04:30:51.325Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6933b1d1ef1313dee52d9cbf" },
        "action": "CREATE",
        "entity": "TRANSACTION",
        "details": "Created expense of 30 for Fare",
        "createdAt": { "$date": "2025-12-06T04:32:17.917Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6933b228177737b13cbfe81b" },
        "action": "CREATE",
        "entity": "TRANSACTION",
        "details": "Created expense of 20 for Returned",
        "createdAt": { "$date": "2025-12-06T04:33:44.163Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6933b25430e11b4b03ed5f34" },
        "action": "CREATE",
        "entity": "TRANSACTION",
        "details": "Created income of 100 for Fare",
        "createdAt": { "$date": "2025-12-06T04:34:28.975Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6933bdb4d91b470470c8a431" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T05:23:00.449Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6933dcb5d37eb04825a94758" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T07:35:17.934Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "693432eb4d5dea842dd563c6" },
        "action": "CREATE",
        "entity": "TRANSACTION",
        "details": "Created expense of 20 for Food",
        "createdAt": { "$date": "2025-12-06T13:43:07.932Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "69343ab77595b543231089b2" },
        "action": "CREATE",
        "entity": "TRANSACTION",
        "details": "Created expense of 10 for Fare",
        "createdAt": { "$date": "2025-12-06T14:16:23.258Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "69345fcdaadae53b67f6dff1" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T16:54:37.738Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "693463cfaadae53b67f6e1ef" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T17:11:43.151Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "693465ac7cfdc545da20830c" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T17:19:40.330Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6934676a7cfdc545da208392" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T17:27:06.724Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "69346bcc7cfdc545da20847b" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T17:45:48.411Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "69346c4a7cfdc545da2084d4" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T17:47:54.839Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "69346cdb7cfdc545da20852d" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T17:50:19.992Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "69347556ce999dceae919e8f" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T18:26:30.197Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "693476c8ce999dceae919f2d" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T18:32:40.383Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "693478c1ce999dceae919ff8" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-06T18:41:05.831Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "693508abce999dceae91a0d0" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-07T04:55:07.446Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "69350a69ce999dceae91a279" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-07T05:02:33.964Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6935314d8dffb6e38d551eb7" },
        "action": "CREATE",
        "entity": "TRANSACTION",
        "details": "Created expense of 40 for Haircut ",
        "createdAt": { "$date": "2025-12-07T07:48:29.100Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "69358df2083fe98e7adee273" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-07T14:23:46.615Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "69358f22083fe98e7adee353" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-07T14:28:50.760Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6936539eacad36e91429b0f3" },
        "action": "CREATE",
        "entity": "TRANSACTION",
        "details": "Created expense of 10 for Fare",
        "createdAt": { "$date": "2025-12-08T04:27:10.660Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "69366b2e86c637dbe41d4d39" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-08T06:07:42.106Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6936dda46dfabacc239a5121" },
        "action": "CREATE",
        "entity": "TRANSACTION",
        "details": "Created expense of 10 for Fare",
        "createdAt": { "$date": "2025-12-08T14:16:04.901Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6936fb8ade6e23ffe743d795" },
        "action": "CREATE",
        "entity": "TRANSACTION",
        "details": "Created income of 1 for Fare",
        "createdAt": { "$date": "2025-12-08T16:23:38.162Z" },
        "__v": 0
    },
    {
        "_id": { "$oid": "6936fd4bd00dcb0603c7304f" },
        "action": "LOGIN",
        "entity": "SESSION",
        "details": "User logged in",
        "createdAt": { "$date": "2025-12-08T16:31:07.415Z" },
        "__v": 0
    }
];

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const userId = await requireUser();

        const logs = rawData.map(item => ({
            // _id: new mongoose.Types.ObjectId(item._id.$oid), // Optional: keep original ID or let Mongo generate
            userId: new mongoose.Types.ObjectId(userId),
            action: item.action,
            entity: item.entity,
            details: item.details,
            createdAt: new Date(item.createdAt.$date)
        }));

        // 1. Insert into User.activityLogs
        // Filter out duplicates if needed, but for now just push
        await User.updateOne(
            { _id: userId },
            { $push: { activityLogs: { $each: logs } } }
        );

        // 2. Insert into ActivityLog collection (optional, if they aren't there)
        // We'll try to insert, but ignore errors if they exist (though we are generating new IDs here effectively if we don't use the original _id)
        // If we want to preserve _id, we should use it.

        const logsWithIds = rawData.map(item => ({
            _id: new mongoose.Types.ObjectId(item._id.$oid),
            userId: new mongoose.Types.ObjectId(userId),
            action: item.action,
            entity: item.entity,
            details: item.details,
            createdAt: new Date(item.createdAt.$date)
        }));

        try {
            await ActivityLog.insertMany(logsWithIds, { ordered: false });
        } catch (e) {
            console.log("Some logs might already exist in ActivityLog collection, continuing...");
        }

        return NextResponse.json({ success: true, count: logs.length, message: "Logs backfilled successfully" });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
