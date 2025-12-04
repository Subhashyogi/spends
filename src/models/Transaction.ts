import { Schema, model, models } from 'mongoose';

const TransactionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String },
    category: { type: String },
    account: { type: String, enum: ['cash', 'bank', 'upi', 'wallet'], default: 'cash' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Transaction = models.Transaction || model('Transaction', TransactionSchema);
export default Transaction;
