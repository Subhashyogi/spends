import mongoose from "mongoose";

const ChallengeSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['no_spend', 'budget_cut', 'savings_sprint'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: String,
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    targetValue: {
        type: Number,
        required: true,
    },
    currentValue: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'failed'],
        default: 'active',
    },
    metadata: {
        type: Object, // Store extra info like "category to cut"
        default: {}
    }
}, { timestamps: true });

export default mongoose.models.Challenge || mongoose.model("Challenge", ChallengeSchema);
