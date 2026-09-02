const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Database: Indian Railways Mock Dataset
const trains = [
  {
    trainNumber: "12952",
    trainName: "Mumbai Rajdhani Express",
    from: "NDLS",
    fromName: "New Delhi",
    to: "MMCT",
    toName: "Mumbai Central",
    departureTime: "16:55",
    arrivalTime: "08:35 (+1 day)",
    duration: "15h 40m",
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    classes: {
      "1A": { name: "First AC", seats: 12, fare: 3850 },
      "2A": { name: "AC 2 Tier", seats: 24, fare: 2450 },
      "3A": { name: "AC 3 Tier", seats: 42, fare: 1750 },
      "SL": { name: "Sleeper", seats: 75, fare: 680 }
    }
  },
  {
    trainNumber: "12002",
    trainName: "Bhopal Shatabdi Express",
    from: "NDLS",
    fromName: "New Delhi",
    to: "RKMP",
    toName: "Rani Kamalapati (Bhopal)",
    departureTime: "06:00",
    arrivalTime: "14:40",
    duration: "08h 40m",
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    classes: {
      "EC": { name: "Exec. Chair Car", seats: 18, fare: 2120 },
      "CC": { name: "AC Chair Car", seats: 65, fare: 1165 }
    }
  },
  {
    trainNumber: "12302",
    trainName: "Howrah Rajdhani Express",
    from: "NDLS",
    fromName: "New Delhi",
    to: "HWH",
    toName: "Howrah Junction (Kolkata)",
    departureTime: "16:50",
    arrivalTime: "09:55 (+1 day)",
    duration: "17h 05m",
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    classes: {
      "1A": { name: "First AC", seats: 8, fare: 4100 },
      "2A": { name: "AC 2 Tier", seats: 19, fare: 2600 },
      "3A": { name: "AC 3 Tier", seats: 35, fare: 1850 }
    }
  },
  {
    trainNumber: "20901",
    trainName: "Vande Bharat Express",
    from: "NDLS",
    fromName: "New Delhi",
    to: "ADI",
    toName: "Ahmedabad Junction",
    departureTime: "06:10",
    arrivalTime: "14:05",
    duration: "07h 55m",
    runsOn: ["Mon", "Tue", "Wed", "Fri", "Sat", "Sun"],
    classes: {
      "EC": { name: "Exec. Chair Car", seats: 14, fare: 2490 },
      "CC": { name: "AC Chair Car", seats: 52, fare: 1365 }
    }
  },
  {
    trainNumber: "12260",
    trainName: "Sealdah Duronto Express",
    from: "NDLS",
    fromName: "New Delhi",
    to: "SDAH",
    toName: "Sealdah (Kolkata)",
    departureTime: "19:45",
    arrivalTime: "12:25 (+1 day)",
    duration: "16h 40m",
    runsOn: ["Mon", "Wed", "Thu", "Sat"],
    classes: {
      "1A": { name: "First AC", seats: 10, fare: 3950 },
      "2A": { name: "AC 2 Tier", seats: 22, fare: 2520 },
      "3A": { name: "AC 3 Tier", seats: 48, fare: 1790 }
    }
  },
  {
    trainNumber: "12658",
    trainName: "KSR Bengaluru Mail",
    from: "MAS",
    fromName: "Chennai Central",
    to: "SBC",
    toName: "KSR Bengaluru",
    departureTime: "22:40",
    arrivalTime: "04:30 (+1 day)",
    duration: "05h 50m",
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    classes: {
      "1A": { name: "First AC", seats: 6, fare: 1450 },
      "2A": { name: "AC 2 Tier", seats: 18, fare: 950 },
      "3A": { name: "AC 3 Tier", seats: 40, fare: 680 },
      "SL": { name: "Sleeper", seats: 90, fare: 275 }
    }
  },
  {
    trainNumber: "12626",
    trainName: "Kerala Express",
    from: "NDLS",
    fromName: "New Delhi",
    to: "TVC",
    toName: "Thiruvananthapuram Central",
    departureTime: "20:10",
    arrivalTime: "18:00 (+2 days)",
    duration: "45h 50m",
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    classes: {
      "2A": { name: "AC 2 Tier", seats: 15, fare: 3100 },
      "3A": { name: "AC 3 Tier", seats: 30, fare: 2150 },
      "SL": { name: "Sleeper", seats: 110, fare: 840 }
    }
  },
  {
    trainNumber: "12214",
    trainName: "Delhi Sarai Rohilla Duronto",
    from: "YPR",
    fromName: "Yesvantpur (Bengaluru)",
    to: "DEE",
    toName: "Delhi Sarai Rohilla",
    departureTime: "23:40",
    arrivalTime: "13:30 (+2 days)",
    duration: "37h 50m",
    runsOn: ["Sat"],
    classes: {
      "1A": { name: "First AC", seats: 4, fare: 4800 },
      "2A": { name: "AC 2 Tier", seats: 12, fare: 3050 },
      "3A": { name: "AC 3 Tier", seats: 32, fare: 2100 }
    }
  }
];

// In-Memory Database: Bookings
const bookings = new Map();

// Helper: Generate Authentic 10-digit Indian Railways PNR
function generatePNR() {
  let pnr;
  do {
    const prefix = Math.floor(100 + Math.random() * 900); // 3-digit zone prefix e.g. 482, 245, 612
    const suffix = Math.floor(1000001 + Math.random() * 8999999); // 7-digit random identifier
    pnr = `${prefix}${suffix}`;
  } while (bookings.has(pnr));
  return pnr;
}

// Helper: Generate Random Coach & Seat Allocation based on Class Tier
function allocateSeat(classTier, berthPreference) {
  const coachPrefixes = {
    "1A": ["H1", "H2"],
    "2A": ["A1", "A2", "A3"],
    "3A": ["B1", "B2", "B3", "B4", "B5"],
    "CC": ["C1", "C2", "C3"],
    "EC": ["E1", "E2"],
    "SL": ["S1", "S2", "S3", "S4", "S5", "S6"]
  };

  const coaches = coachPrefixes[classTier] || ["B1", "B2"];
  const coach = coaches[Math.floor(Math.random() * coaches.length)];
  const seatNumber = Math.floor(1 + Math.random() * 64);

  const berthOptions = ["Lower", "Middle", "Upper", "Side Lower", "Side Upper"];
  let berthType = berthPreference && berthPreference !== "No Preference" 
    ? berthPreference 
    : berthOptions[Math.floor(Math.random() * berthOptions.length)];
  
  if (classTier === "CC" || classTier === "EC") {
    berthType = seatNumber % 2 === 0 ? "Window Seat" : "Aisle Seat";
  }

  return { coach, seatNumber, berthType };
}

// API Routes

/**
 * GET /api/trains/search
 * Query Params: from, to, date
 * Returns array of trains matching search criteria or all trains if parameters are empty
 */
app.get('/api/trains/search', (req, res) => {
  const { from = '', to = '', date = '' } = req.query;

  const fromQuery = from.trim().toLowerCase();
  const toQuery = to.trim().toLowerCase();

  let results = trains;

  if (fromQuery || toQuery) {
    results = trains.filter(t => {
      const matchFrom = !fromQuery || 
        t.from.toLowerCase().includes(fromQuery) || 
        t.fromName.toLowerCase().includes(fromQuery);
      
      const matchTo = !toQuery || 
        t.to.toLowerCase().includes(toQuery) || 
        t.toName.toLowerCase().includes(toQuery);

      return matchFrom && matchTo;
    });
  }

  res.json({
    success: true,
    count: results.length,
    date: date || new Date().toISOString().split('T')[0],
    trains: results
  });
});

/**
 * GET /api/trains/:number
 * Returns details for a specific train
 */
app.get('/api/trains/:number', (req, res) => {
  const train = trains.find(t => t.trainNumber === req.params.number);
  if (!train) {
    return res.status(404).json({ success: false, message: "Train not found" });
  }
  res.json({ success: true, train });
});

/**
 * POST /api/bookings/create
 * Request Body: { trainNumber, classTier, passengerName, passengerAge, passengerGender, berthPreference, dateOfJourney }
 */
app.post('/api/bookings/create', (req, res) => {
  const { 
    trainNumber, 
    classTier, 
    passengerName, 
    passengerAge, 
    passengerGender = "Unspecified",
    berthPreference = "No Preference",
    dateOfJourney
  } = req.body;

  // Validation
  if (!trainNumber || !classTier || !passengerName || !passengerAge || !dateOfJourney) {
    return res.status(400).json({
      success: false,
      message: "Missing required booking details. Please provide trainNumber, classTier, passengerName, passengerAge, and dateOfJourney."
    });
  }

  const train = trains.find(t => t.trainNumber === trainNumber);
  if (!train) {
    return res.status(404).json({ success: false, message: "Specified train not found." });
  }

  const selectedClass = train.classes[classTier];
  if (!selectedClass) {
    return res.status(400).json({ success: false, message: `Class ${classTier} is not available on this train.` });
  }

  if (selectedClass.seats <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Regret! No available seats remaining in ${selectedClass.name} (${classTier}).` 
    });
  }

  // Decrement inventory
  selectedClass.seats -= 1;

  // Generate Booking Receipt
  const pnr = generatePNR();
  const seatAllocation = allocateSeat(classTier, berthPreference);
  const bookingDate = new Date().toISOString();

  const bookingReceipt = {
    pnr,
    trainNumber: train.trainNumber,
    trainName: train.trainName,
    from: `${train.fromName} (${train.from})`,
    to: `${train.toName} (${train.to})`,
    departureTime: train.departureTime,
    arrivalTime: train.arrivalTime,
    duration: train.duration,
    dateOfJourney,
    classTier,
    className: selectedClass.name,
    passenger: {
      name: passengerName,
      age: parseInt(passengerAge, 10),
      gender: passengerGender,
      berthPreference
    },
    seatAllocation,
    fare: selectedClass.fare,
    convenienceFee: 15,
    totalAmount: selectedClass.fare + 15,
    bookingStatus: "CONFIRMED",
    bookedAt: bookingDate
  };

  bookings.set(pnr, bookingReceipt);

  res.status(201).json({
    success: true,
    message: "Ticket successfully reserved & confirmed!",
    booking: bookingReceipt
  });
});

/**
 * GET /api/bookings/:pnr
 * Retrieve booking receipt by 10-digit PNR
 */
app.get('/api/bookings/:pnr', (req, res) => {
  const { pnr } = req.params;
  const booking = bookings.get(pnr);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "No reservation found for the provided PNR number."
    });
  }

  res.json({ success: true, booking });
});

/**
 * DELETE /api/bookings/:pnr
 * Cancel booking and restore seat inventory
 */
app.delete('/api/bookings/:pnr', (req, res) => {
  const { pnr } = req.params;
  const booking = bookings.get(pnr);

  if (!booking) {
    return res.status(404).json({ success: false, message: "No reservation found for this PNR." });
  }

  if (booking.bookingStatus === "CANCELLED") {
    return res.status(400).json({ success: false, message: "Booking is already cancelled." });
  }

  // Restore inventory
  const train = trains.find(t => t.trainNumber === booking.trainNumber);
  if (train && train.classes[booking.classTier]) {
    train.classes[booking.classTier].seats += 1;
  }

  booking.bookingStatus = "CANCELLED";
  booking.cancelledAt = new Date().toISOString();

  res.json({
    success: true,
    message: "Reservation successfully cancelled. Refund processed.",
    booking
  });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 RailReserve Management System Server is running!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
