import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    accounts: { type: [String], default: ['cash', 'bank', 'upi', 'wallet'] },
    currency: { type: String, default: 'INR' },
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
            createdAt: { type: Date },
            updatedAt: { type: Date },
          },
          {}
        ),
      ],
      default: [],
    },
    budgets: {
      type: [
        new Schema(
          {
            _id: { type: Schema.Types.ObjectId, required: true },
            month: { type: String, required: true },
            amount: { type: Number, required: true, min: 0 },
            category: { type: String },
            createdAt: { type: Date },
            updatedAt: { type: Date },
          },
          {}
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const User = models.User || model('User', UserSchema);
export default User;
