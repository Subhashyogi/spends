import { Schema, model, models } from 'mongoose';

const InsightSchema = new Schema(
    {
        userId: { type: String, required: true, index: true },
        type: {
            type: String,
            enum: ['budget_adjust', 'recurring_transaction', 'alert', 'savings_opportunity'],
            required: true
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        data: { type: Schema.Types.Mixed }, // Payload for the action (e.g., predicted amount, detected category)
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'dismissed'],
            default: 'pending'
        },
        confidence: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    },
    { timestamps: true }
);

const Insight = models.Insight || model('Insight', InsightSchema);
export default Insight;
