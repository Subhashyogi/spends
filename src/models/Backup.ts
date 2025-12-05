import mongoose from 'mongoose';

const BackupSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    data: {
        type: String, // Encrypted base64 string
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Backup || mongoose.model('Backup', BackupSchema);
