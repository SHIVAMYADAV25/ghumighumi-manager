require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Activity = require('../models/Activity');
const Checklist = require('../models/Checklist');
const Expense = require('../models/Expense');
const logger = require('./logger');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info('Connected to DB for seeding...');

  // Clear existing
  await Promise.all([
    User.deleteMany({}),
    Trip.deleteMany({}),
    Itinerary.deleteMany({}),
    Activity.deleteMany({}),
    Checklist.deleteMany({}),
    Expense.deleteMany({}),
  ]);

  // Create users
  const [alice, bob, carol] = await User.create([
    { name: 'Alice Chen', email: 'alice@wandersync.dev', password: 'Password123!', isEmailVerified: true },
    { name: 'Bob Rivera', email: 'bob@wandersync.dev', password: 'Password123!', isEmailVerified: true },
    { name: 'Carol Kim', email: 'carol@wandersync.dev', password: 'Password123!', isEmailVerified: true },
  ]);

  // Create a trip
  const trip = await Trip.create({
    title: 'Tokyo Adventure 2025',
    description: 'Epic two-week Japan trip covering Tokyo, Kyoto, and Osaka.',
    destination: {
      name: 'Tokyo, Japan',
      country: 'Japan',
      coordinates: { lat: 35.6762, lng: 139.6503 },
    },
    startDate: new Date('2025-10-01'),
    endDate: new Date('2025-10-14'),
    travelers: 3,
    budget: { total: 6000, currency: 'USD', spent: 1200 },
    tags: ['japan', 'asia', 'culture', 'food'],
    owner: alice._id,
    collaborators: [
      { user: bob._id, role: 'editor', joinedAt: new Date() },
      { user: carol._id, role: 'viewer', joinedAt: new Date() },
    ],
    status: 'planning',
  });

  // Itinerary days
  const itineraries = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date('2025-10-01');
    date.setDate(date.getDate() + i);
    itineraries.push({
      trip: trip._id,
      dayNumber: i + 1,
      date,
      title: i === 0 ? 'Arrival Day' : i === 13 ? 'Departure Day' : '',
      createdBy: alice._id,
    });
  }
  const savedDays = await Itinerary.insertMany(itineraries);

  // Activities for day 1
  await Activity.insertMany([
    {
      trip: trip._id,
      itinerary: savedDays[0]._id,
      title: 'Check in at Shinjuku Hotel',
      category: 'accommodation',
      startTime: '15:00',
      endTime: '16:00',
      location: { name: 'Park Hyatt Tokyo', address: '3-7-1-2 Nishi Shinjuku' },
      cost: { amount: 350, currency: 'USD', isPaid: true },
      status: 'confirmed',
      bookingInfo: { status: 'confirmed', reference: 'PH-12345' },
      order: 0,
      createdBy: alice._id,
    },
    {
      trip: trip._id,
      itinerary: savedDays[0]._id,
      title: 'Ramen dinner at Ichiran',
      category: 'food',
      startTime: '19:00',
      endTime: '20:30',
      location: { name: 'Ichiran Shinjuku', address: 'Shinjuku, Tokyo' },
      cost: { amount: 15, currency: 'USD' },
      order: 1,
      createdBy: bob._id,
    },
    {
      trip: trip._id,
      itinerary: savedDays[0]._id,
      title: 'Explore Shinjuku Golden Gai',
      category: 'activity',
      startTime: '21:00',
      location: { name: 'Golden Gai', address: 'Kabukicho, Shinjuku' },
      order: 2,
      createdBy: alice._id,
    },
  ]);

  // Checklists
  await Checklist.create({
    trip: trip._id,
    title: 'Packing List',
    type: 'packing',
    color: '#E8C547',
    createdBy: alice._id,
    items: [
      { text: 'Passport', order: 0, priority: 'high', isCompleted: true, completedBy: alice._id },
      { text: 'Travel insurance documents', order: 1, priority: 'high' },
      { text: 'JR Pass (pre-ordered)', order: 2, priority: 'high', isCompleted: true, completedBy: alice._id },
      { text: 'Portable WiFi device', order: 3, priority: 'medium' },
      { text: 'Universal power adapter', order: 4, priority: 'medium' },
      { text: 'Yen cash (~¥50,000)', order: 5, priority: 'high' },
      { text: 'Comfortable walking shoes', order: 6, priority: 'medium' },
    ],
  });

  // Expenses
  await Expense.insertMany([
    {
      trip: trip._id,
      title: 'JR Passes x3',
      amount: 540,
      currency: 'USD',
      amountInBaseCurrency: 540,
      category: 'transport',
      paidBy: alice._id,
      splitType: 'equal',
      splits: [
        { user: bob._id, amount: 180, isPaid: false },
        { user: carol._id, amount: 180, isPaid: false },
      ],
      date: new Date('2025-09-15'),
      createdBy: alice._id,
    },
    {
      trip: trip._id,
      title: 'Hotel deposit — Park Hyatt',
      amount: 700,
      currency: 'USD',
      amountInBaseCurrency: 700,
      category: 'accommodation',
      paidBy: alice._id,
      splitType: 'equal',
      date: new Date('2025-09-20'),
      createdBy: alice._id,
    },
  ]);

  logger.info('✅ Seed complete!');
  logger.info(`Users: alice@wandersync.dev | bob@wandersync.dev | carol@wandersync.dev`);
  logger.info('Password for all: Password123!');
  process.exit(0);
};

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});