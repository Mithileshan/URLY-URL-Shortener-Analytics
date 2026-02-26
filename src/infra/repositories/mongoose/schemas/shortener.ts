import pkg from 'mongoose';
import { Shortener } from '../../../../domain/entities/shortener';
const { Schema, model } = pkg;

const shortenerSchema = new Schema<Shortener>({
    long_url: { type: String, required: true },
    short_url: { type: String, required: true, unique: true },
    clicks: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
});

export const ShortenerSchema = model<Shortener>('Shortener', shortenerSchema);