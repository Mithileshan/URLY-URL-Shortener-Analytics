import pkg from 'mongoose';
import { Click } from '../../../../domain/entities/click';
const { Schema, model } = pkg;

const clickSchema = new Schema<Click>({
    shortCode: { type: String, required: true },
    ip:        { type: String, default: '' },
    userAgent: { type: String, default: '' },
    referrer:  { type: String, default: '' },
    timestamp: { type: Date,   default: Date.now },
});

clickSchema.index({ shortCode: 1, timestamp: -1 });

export const ClickModel = model<Click>('Click', clickSchema);
