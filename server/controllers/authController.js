import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAuthCookies, setAuthCookies } from '../utils/generateToken.js';

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  const user = await User.create({ name, email, password });
  setAuthCookies(res, user._id);

  res.status(201).json({ user: serializeUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  setAuthCookies(res, user._id);
  res.json({ user: serializeUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  res.json({ message: 'Logged out' });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  setAuthCookies(res, decoded.userId);
  res.json({ message: 'Session refreshed' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user) });
});
