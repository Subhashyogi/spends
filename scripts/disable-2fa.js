const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function disable2FA() {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: process.env.MONGODB_DB
        });
        console.log('Connected to database');

        const users = await User.find({}, 'email');
        console.log('Users found:', users);

        const userId = '6931b5a76020c75524351c94';
        const userBefore = await User.findById(userId);
        console.log('User before update:', userBefore);

        const result = await User.updateOne(
            { _id: userId },
            {
                $set: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null
                }
            }
        );
        console.log('Update result:', result);

        const userAfter = await User.findById(userId);
        console.log('User after update:', userAfter);

        console.log(`Updated user ${userId}:`, result);
        process.exit(0);
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        process.exit(1);
    }
}

disable2FA();
