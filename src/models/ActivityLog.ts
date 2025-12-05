import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        enum: ['LOGIN', 'CREATE', 'UPDATE', 'DELETE'],
        required: true,
    },
    entity: {
        type: String,
        enum: ['TRANSACTION', 'BUDGET', 'GOAL', 'SESSION'],
        required: true,
    },
    details: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
