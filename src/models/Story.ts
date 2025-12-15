import { Schema, model, models } from 'mongoose';

const StorySchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['text', 'image', 'badge', 'health', 'stat'], default: 'text' },
        content: { type: String, required: true }, // Text content or Value (e.g. "85" for score)
        title: { type: String }, // For rich cards
        subtext: { type: String }, // For rich cards
        icon: { type: String }, // Icon name
        color: { type: String, default: 'from-blue-500 to-indigo-600' }, // Gradient class
        font: { type: String, default: 'font-sans' }, // Font class
        expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-delete after expiration
        viewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

const Story = models.Story || model('Story', StorySchema);
export default Story;
