import { Schema, model, models } from 'mongoose';

const GoalSchema = new Schema(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        targetAmount: { type: Number, required: true, min: 1 },
        currentAmount: { type: Number, default: 0, min: 0 },
        deadline: { type: Date },
        color: { type: String, default: '#6366f1' }, // indigo-500
    },
    { timestamps: true }
);

const Goal = models.Goal || model('Goal', GoalSchema);
export default Goal;
