import pkg from 'mongoose';
const { Schema, model } = pkg;

const userSchema = new Schema({
    name:         { type: String, required: true },
    email:        { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    createdAt:    { type: Date, default: Date.now },
});

export const UserModel = model('User', userSchema);
