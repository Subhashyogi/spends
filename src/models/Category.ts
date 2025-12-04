import { Schema, model, models } from 'mongoose';

const CategorySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    color: { type: String, default: '#64748b' }, // zinc-500 default
    icon: { type: String, default: 'Tag' },
  },
  { timestamps: true }
);

// Note: Uniqueness temporarily disabled to avoid index creation failures if legacy duplicates exist.
// CategorySchema.index({ userId: 1, type: 1, name: 1 }, { unique: true });

const Category = models.Category || model('Category', CategorySchema);
export default Category;
