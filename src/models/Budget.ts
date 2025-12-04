import { Schema, model, models } from 'mongoose';

const BudgetSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, month: 1, category: 1 }, { unique: true });

const Budget = models.Budget || model('Budget', BudgetSchema);
export default Budget;
