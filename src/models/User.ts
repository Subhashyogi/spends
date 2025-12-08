import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, unique: true, trim: true, lowercase: true, sparse: true }, // sparse allows nulls for existing users
    avatar: { type: String },
    friends: {
      type: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        username: String,
        name: String,
        image: String,
        // Advanced Message Schema
        messages: [{
          _id: { type: Schema.Types.ObjectId, auto: true },
          sender: { type: Schema.Types.ObjectId, ref: 'User' },
          content: { type: String, default: "" },
          type: { type: String, enum: ['text', 'image', 'video', 'audio'], default: 'text' },
          fileUrl: String,
          createdAt: { type: Date, default: Date.now },
          read: { type: Boolean, default: false }
        }]
      }],
      default: []
    },
    friendRequests: {
      type: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        username: String,
        name: String,
        type: { type: String, enum: ['incoming', 'outgoing'] },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        createdAt: { type: Date, default: Date.now }
      }],
      default: []
    },
    passwordHash: { type: String, required: true },
    appPin: { type: String }, // Hashed PIN for app lock
    accounts: { type: [String], default: ['cash', 'bank', 'upi', 'wallet'] },
    currency: { type: String, default: 'INR' },
    partnerId: { type: Schema.Types.ObjectId, ref: 'User' },
    partnerName: { type: String },
    inviteCode: { type: String, unique: true, sparse: true },
    transactions: {
      type: [
        new Schema(
          {
            _id: { type: Schema.Types.ObjectId, required: true },
            type: { type: String, enum: ['income', 'expense'], required: true },
            amount: { type: Number, required: true },
            description: { type: String },
            category: { type: String },
            account: { type: String },
            date: { type: Date },
            originalAmount: { type: Number },
            originalCurrency: { type: String },
            exchangeRate: { type: Number },
            isRecurring: { type: Boolean, default: false },
            frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
            tags: { type: [String], default: [] },
            split: {
              type: [{
                userId: { type: Schema.Types.ObjectId, ref: 'User' },
                username: String,
                amount: Number,
                isSettled: { type: Boolean, default: false }
              }],
              default: []
            },
            hasWarranty: { type: Boolean, default: false },
            createdAt: { type: Date },
            updatedAt: { type: Date },
          },
          {}
        ),
      ],
      default: [],
    },
    badges: {
      type: [
        new Schema(
          {
            id: { type: String, required: true },
            unlockedAt: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    rules: {
      type: [
        new Schema(
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            condition: {
              field: { type: String, enum: ['category', 'amount', 'time'], required: true },
              operator: { type: String, enum: ['equals', 'gt', 'lt'], required: true },
              value: { type: Schema.Types.Mixed, required: true }
            },
            action: {
              type: { type: String, enum: ['tag', 'confirm', 'alert'], required: true },
              value: { type: String }
            },
            enabled: { type: Boolean, default: true }
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    sessions: {
      type: [{
        sessionId: { type: String, required: true },
        userAgent: { type: String },
        ip: { type: String },
        lastActive: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now }
      }],
      default: []
    },
    activityLogs: {
      type: [{
        action: { type: String, enum: ['LOGIN', 'CREATE', 'UPDATE', 'DELETE'], required: true },
        entity: { type: String, enum: ['TRANSACTION', 'BUDGET', 'GOAL', 'SESSION'], required: true },
        details: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }],
      default: []
    }
  },
  { timestamps: true }
);

const User = models.User || model('User', UserSchema);
export default User;
