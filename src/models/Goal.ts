import mongoose, { Schema, Model } from 'mongoose';

const GoalSchema = new Schema(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, required: true },
        targetAmount: { type: Number, required: true },
        currentAmount: { type: Number, default: 0 },
        deadline: { type: Date, required: false },
        status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
        color: { type: String, default: 'indigo' }, // For UI theming
    },
    { timestamps: true }
);

// Prevent overwrite
const Goal: Model<any> = mongoose.models.Goal || mongoose.model('Goal', GoalSchema);

export default Goal;
