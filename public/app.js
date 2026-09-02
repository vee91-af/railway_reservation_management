/**
 * RailReserve Frontend Client Application Logic
 */

// Application State
let allTrains = [];
let activeClassFilter = 'ALL';
let selectedBooking = {
  train: null,
  classKey: null,
  classData: null
};
let activeModalBooking = null;

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set default date to today
  const dateInput = document.getElementById('journeyDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;
  }

  // Initial load of trains
  fetchTrains();
});

/**
 * Fetch trains from API backend
 */
async function fetchTrains(from = '', to = '', date = '') {
  const container = document.getElementById('trainsContainer');
  container.innerHTML = `
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
      <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl">
        <i class="fa-solid fa-spinner fa-spin"></i>
      </div>
      <p class="text-sm text-slate-500 font-medium">Searching available express trains...</p>
    </div>
  `;

  try {
    const queryParams = new URLSearchParams();
    if (from) queryParams.append('from', from);
    if (to) queryParams.append('to', to);
    if (date) queryParams.append('date', date);

    const response = await fetch(`/api/trains/search?${queryParams.toString()}`);
    const data = await response.json();

    if (data.success) {
      allTrains = data.trains;
      updateSearchSummary(data.count, from, to);
      renderTrains();
    } else {
      showToast(data.message || 'Failed to fetch trains', 'error');
    }
  } catch (error) {
    console.error('Error fetching trains:', error);
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-8 text-center border border-red-200 text-red-600 space-y-2">
        <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
        <p class="font-bold text-sm">Unable to connect to RailReserve server.</p>
        <p class="text-xs text-slate-500">Please make sure the server is running on http://localhost:3000</p>
      </div>
    `;
  }
}

/**
 * Update Search Summary Text & Badges
 */
function updateSearchSummary(count, from, to) {
  const badge = document.getElementById('trainCountBadge');
  const summaryText = document.getElementById('searchSummaryText');

  if (badge) {
    badge.textContent = `${count} ${count === 1 ? 'train' : 'trains'} found`;
  }

  if (summaryText) {
    if (from || to) {
      summaryText.textContent = `Results for route ${from.toUpperCase() || 'Any'} ➔ ${to.toUpperCase() || 'Any'}`;
    } else {
      summaryText.textContent = 'Showing all available Indian Railways express trains';
    }
  }
}

/**
 * Render Train Cards
 */
function renderTrains() {
  const container = document.getElementById('trainsContainer');
  if (!container) return;

  if (allTrains.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
        <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
          <i class="fa-solid fa-train-subway"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-800">No Trains Found</h3>
          <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">No direct train services match your specified station route. Try searching for major hubs like NDLS, MMCT, HWH, or MAS.</p>
        </div>
        <button onclick="resetSearch()" class="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition">
          Show All Trains
        </button>
      </div>
    `;
    return;
  }

  let html = '';

  allTrains.forEach(train => {
    // Filter classes if a filter pill is active
    const availableClasses = Object.entries(train.classes).filter(([key]) => {
      if (activeClassFilter === 'ALL') return true;
      return key === activeClassFilter;
    });

    if (activeClassFilter !== 'ALL' && availableClasses.length === 0) {
      return; // Skip train if it doesn't offer the filtered class
    }

    const runsOnBadges = train.runsOn.map(day => 
      `<span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">${day}</span>`
    ).join(' ');

    html += `
      <div class="train-card bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-200/80 space-y-5 relative">
        
        <!-- Header: Train Number & Name -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-3">
            <span class="bg-indigo-950 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg tracking-wider">
              #${train.trainNumber}
            </span>
            <h3 class="text-base sm:text-lg font-extrabold text-slate-900">${train.trainName}</h3>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-[11px] text-slate-400 font-medium">Runs On:</span>
            <div class="flex flex-wrap gap-1">${runsOnBadges}</div>
          </div>
        </div>

        <!-- Schedule Timeline Grid -->
        <div class="grid grid-cols-12 gap-2 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
          
          <!-- Origin -->
          <div class="col-span-4 space-y-0.5">
            <div class="text-lg font-black text-slate-900">${train.departureTime}</div>
            <div class="text-xs font-bold text-slate-700">${train.fromName}</div>
            <div class="text-[10px] text-slate-400 font-mono font-bold">${train.from}</div>
          </div>

          <!-- Duration Line -->
          <div class="col-span-4 text-center space-y-1">
            <span class="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-xs inline-block">
              ${train.duration}
            </span>
            <div class="relative flex items-center justify-center">
              <div class="w-full h-0.5 bg-slate-300"></div>
              <div class="absolute w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                <i class="fa-solid fa-train"></i>
              </div>
            </div>
            <span class="text-[10px] text-emerald-600 font-semibold">Direct Service</span>
          </div>

          <!-- Destination -->
          <div class="col-span-4 text-right space-y-0.5">
            <div class="text-lg font-black text-slate-900">${train.arrivalTime}</div>
            <div class="text-xs font-bold text-slate-700">${train.toName}</div>
            <div class="text-[10px] text-slate-400 font-mono font-bold">${train.to}</div>
          </div>

        </div>

        <!-- Class Tiers Grid -->
        <div class="space-y-2">
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Class & View Seat Availability:</div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    `;

    Object.entries(train.classes).forEach(([classKey, classObj]) => {
      const isSelected = selectedBooking.train?.trainNumber === train.trainNumber && selectedBooking.classKey === classKey;
      const isAvailable = classObj.seats > 0;
      const seatColor = classObj.seats > 20 
        ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
        : (classObj.seats > 0 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200');

      html += `
        <button type="button" 
          onclick="selectClassForBooking('${train.trainNumber}', '${classKey}')"
          class="class-chip text-left p-3 rounded-2xl border transition-all ${isSelected ? 'active border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50'}">
          <div class="flex items-center justify-between">
            <span class="font-extrabold text-sm text-slate-900">${classKey}</span>
            <span class="font-bold text-xs text-blue-600">₹${classObj.fare}</span>
          </div>
          <div class="text-[11px] text-slate-500 mt-0.5 truncate">${classObj.name}</div>
          <div class="mt-2 flex items-center justify-between text-[11px]">
            <span class="px-2 py-0.5 rounded-md font-bold text-[10px] border ${seatColor}">
              ${isAvailable ? `AVL ${classObj.seats}` : 'WL / REGRET'}
            </span>
            <i class="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
          </div>
        </button>
      `;
    });

    html += `
          </div>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Handle Train Search Form Submission
 */
function handleTrainSearch(event) {
  event.preventDefault();
  const from = document.getElementById('fromStation').value;
  const to = document.getElementById('toStation').value;
  const date = document.getElementById('journeyDate').value;

  fetchTrains(from, to, date);
}

/**
 * Swap Origin & Destination Station Inputs
 */
function swapStations() {
  const fromInput = document.getElementById('fromStation');
  const toInput = document.getElementById('toStation');
  
  const temp = fromInput.value;
  fromInput.value = toInput.value;
  toInput.value = temp;

  showToast('Swapped origin and destination stations', 'info');
}

/**
 * Quick Route Selector Shortcut
 */
function setQuickRoute(from, to) {
  document.getElementById('fromStation').value = from;
  document.getElementById('toStation').value = to;
  fetchTrains(from, to);
}

/**
 * Reset Search Form & Show All Trains
 */
function resetSearch() {
  document.getElementById('fromStation').value = '';
  document.getElementById('toStation').value = '';
  fetchTrains();
}

/**
 * Filter Trains by Class Tier Pill
 */
function filterClass(classKey) {
  activeClassFilter = classKey;
  
  // Update Filter Pill Active state
  document.querySelectorAll('.class-filter-btn').forEach(btn => {
    if (btn.textContent.trim() === classKey || (classKey === 'ALL' && btn.textContent.trim() === 'All')) {
      btn.classList.add('bg-white', 'shadow-xs', 'text-blue-600', 'font-semibold');
      btn.classList.remove('text-slate-600', 'font-medium');
    } else {
      btn.classList.remove('bg-white', 'shadow-xs', 'text-blue-600', 'font-semibold');
      btn.classList.add('text-slate-600', 'font-medium');
    }
  });

  renderTrains();
}

/**
 * Select a Class & Populate Sidebar Reservation Form
 */
function selectClassForBooking(trainNumber, classKey) {
  const train = allTrains.find(t => t.trainNumber === trainNumber);
  if (!train) return;

  const classData = train.classes[classKey];
  if (!classData) return;

  if (classData.seats <= 0) {
    showToast(`Sorry, no seats available in ${classData.name} (${classKey}) for train #${train.trainNumber}`, 'error');
    return;
  }

  selectedBooking = { train, classKey, classData };

  // Update Sidebar UI State
  const noSelectionPrompt = document.getElementById('noSelectionPrompt');
  const bookingForm = document.getElementById('bookingForm');
  const selectedClassBadge = document.getElementById('selectedClassBadge');

  if (noSelectionPrompt) noSelectionPrompt.classList.add('hidden');
  if (bookingForm) bookingForm.classList.remove('hidden');
  
  if (selectedClassBadge) {
    selectedClassBadge.classList.remove('hidden');
    selectedClassBadge.textContent = `${train.trainNumber} • ${classKey}`;
  }

  // Populate Summary Details
  document.getElementById('summaryTrainNumber').textContent = `#${train.trainNumber}`;
  document.getElementById('summaryTrainName').textContent = train.trainName;
  document.getElementById('summaryClass').textContent = `${classKey} - ${classData.name}`;
  document.getElementById('summaryRoute').textContent = `${train.from} ➔ ${train.to}`;
  document.getElementById('summaryFare').textContent = `₹${classData.fare}`;

  document.getElementById('breakdownBaseFare').textContent = `₹${classData.fare.toLocaleString('en-IN')}`;
  document.getElementById('breakdownTotal').textContent = `₹${(classData.fare + 15).toLocaleString('en-IN')}`;

  // Highlight selected chip in the list
  renderTrains();

  // Scroll to sidebar on mobile screens
  const sidebarCard = document.getElementById('bookingSidebarCard');
  if (window.innerWidth < 1024 && sidebarCard) {
    sidebarCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  showToast(`Selected ${train.trainName} (${classKey})`, 'success');
}

/**
 * Submit Reservation Form to Server API
 */
async function handleBookingSubmit(event) {
  event.preventDefault();

  if (!selectedBooking.train || !selectedBooking.classKey) {
    showToast('Please select a train and class tier first.', 'warning');
    return;
  }

  const passengerName = document.getElementById('passengerName').value.trim();
  const passengerAge = document.getElementById('passengerAge').value;
  const passengerGender = document.getElementById('passengerGender').value;
  const berthPreference = document.getElementById('berthPreference').value;
  const journeyDate = document.getElementById('journeyDate').value || new Date().toISOString().split('T')[0];

  if (!passengerName || !passengerAge) {
    showToast('Please enter passenger full name and age.', 'warning');
    return;
  }

  const submitBtn = document.getElementById('bookSubmitBtn');
  const originalBtnText = submitBtn.innerHTML;
  
  // Loading State
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>Reserving Seat & Generating PNR...`;

  try {
    const response = await fetch('/api/bookings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainNumber: selectedBooking.train.trainNumber,
        classTier: selectedBooking.classKey,
        passengerName,
        passengerAge,
        passengerGender,
        berthPreference,
        dateOfJourney: journeyDate
      })
    });

    const data = await response.json();

    if (data.success) {
      showToast('Reservation Successful! Ticket Generated.', 'success');
      
      // Open Confirmation Voucher Modal
      openTicketModal(data.booking);

      // Re-fetch train dataset to refresh seat inventory display
      fetchTrains(
        document.getElementById('fromStation').value,
        document.getElementById('toStation').value
      );

      // Reset Form State
      document.getElementById('bookingForm').reset();
      selectedBooking = { train: null, classKey: null, classData: null };
      document.getElementById('bookingForm').classList.add('hidden');
      document.getElementById('noSelectionPrompt').classList.remove('hidden');
      document.getElementById('selectedClassBadge').classList.add('hidden');

    } else {
      showToast(data.message || 'Booking failed. Please try again.', 'error');
    }

  } catch (error) {
    console.error('Booking submission error:', error);
    showToast('Network error while processing booking.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

/**
 * Open Ticket Confirmation Voucher Modal
 */
function openTicketModal(booking) {
  activeModalBooking = booking;

  document.getElementById('ticketPnr').textContent = booking.pnr;
  document.getElementById('ticketDate').textContent = booking.dateOfJourney;
  document.getElementById('ticketTrainInfo').textContent = `${booking.trainNumber} / ${booking.trainName}`;
  document.getElementById('ticketClassInfo').textContent = `${booking.classTier} - ${booking.className}`;
  document.getElementById('ticketFromInfo').textContent = `${booking.from} (${booking.departureTime})`;
  document.getElementById('ticketToInfo').textContent = `${booking.to} (${booking.arrivalTime})`;
  
  document.getElementById('ticketPassengerName').textContent = booking.passenger.name;
  document.getElementById('ticketPassengerMeta').textContent = `${booking.passenger.age} Yrs | ${booking.passenger.gender} | Pref: ${booking.passenger.berthPreference}`;
  
  document.getElementById('ticketSeatInfo').innerHTML = `
    ${booking.seatAllocation.coach} - ${booking.seatAllocation.seatNumber} 
    <span class="text-xs font-normal text-slate-600">(${booking.seatAllocation.berthType})</span>
  `;

  document.getElementById('ticketTotalFare').textContent = `₹${booking.totalAmount.toLocaleString('en-IN')}.00`;
  
  const formattedDate = new Date(booking.bookedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  document.getElementById('ticketBookedAt').textContent = `Booked on ${formattedDate}`;

  // Update Status Badge
  const statusBadge = document.getElementById('ticketStatusBadge');
  const cancelBtn = document.getElementById('cancelTicketBtn');

  if (booking.bookingStatus === 'CONFIRMED') {
    statusBadge.className = 'bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-extrabold border border-emerald-300 inline-block';
    statusBadge.textContent = 'CONFIRMED';
    if (cancelBtn) cancelBtn.classList.remove('hidden');
  } else {
    statusBadge.className = 'bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-extrabold border border-red-300 inline-block';
    statusBadge.textContent = 'CANCELLED';
    if (cancelBtn) cancelBtn.classList.add('hidden');
  }

  // Show Modal
  document.getElementById('ticketModal').classList.remove('hidden');
}

/**
 * Close Ticket Modal
 */
function closeTicketModal() {
  document.getElementById('ticketModal').classList.add('hidden');
  activeModalBooking = null;
}

/**
 * Copy PNR Number to Clipboard
 */
function copyPnr() {
  const pnr = document.getElementById('ticketPnr').textContent;
  if (!pnr) return;

  navigator.clipboard.writeText(pnr).then(() => {
    showToast(`PNR ${pnr} copied to clipboard!`, 'success');
  }).catch(() => {
    showToast('Failed to copy PNR', 'error');
  });
}

/**
 * Cancel Current Ticket
 */
async function cancelCurrentTicket() {
  if (!activeModalBooking || !activeModalBooking.pnr) return;

  if (!confirm(`Are you sure you want to cancel PNR #${activeModalBooking.pnr}? This will release the seat back to inventory.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/bookings/${activeModalBooking.pnr}`, {
      method: 'DELETE'
    });
    const data = await response.json();

    if (data.success) {
      showToast('Reservation successfully cancelled.', 'info');
      openTicketModal(data.booking);
      fetchTrains(); // Refresh live seat counts
    } else {
      showToast(data.message || 'Failed to cancel reservation.', 'error');
    }
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    showToast('Network error while cancelling ticket.', 'error');
  }
}

/**
 * Handle PNR Lookup Form
 */
async function handlePnrLookup(event) {
  event.preventDefault();

  const pnrInput = document.getElementById('pnrSearchInput');
  const pnr = pnrInput.value.trim();
  const container = document.getElementById('pnrResultContainer');

  if (!pnr || pnr.length !== 10) {
    showToast('Please enter a valid 10-digit PNR number.', 'warning');
    return;
  }

  try {
    const response = await fetch(`/api/bookings/${pnr}`);
    const data = await response.json();

    if (data.success) {
      openTicketModal(data.booking);
      showToast(`Found reservation for PNR ${pnr}`, 'success');
    } else {
      showToast(data.message || 'PNR not found in system.', 'error');
    }
  } catch (error) {
    console.error('PNR lookup error:', error);
    showToast('Failed to lookup PNR status.', 'error');
  }
}

/**
 * Open PNR Modal Direct
 */
function openPnrModal() {
  switchTab('pnr');
  const pnrInput = document.getElementById('pnrSearchInput');
  if (pnrInput) pnrInput.focus();
}

/**
 * Switch Navigation Tabs
 */
function switchTab(tab) {
  const searchTab = document.getElementById('searchTabContent');
  const pnrTab = document.getElementById('pnrTabContent');
  const navSearchBtn = document.getElementById('navSearchTab');
  const navPnrBtn = document.getElementById('navPnrTab');

  if (tab === 'search') {
    searchTab.classList.remove('hidden');
    pnrTab.classList.add('hidden');

    navSearchBtn.className = 'px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white shadow-md transition-all';
    navPnrBtn.className = 'px-4 py-2 text-sm font-semibold rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-800/50 transition-all';
  } else if (tab === 'pnr') {
    searchTab.classList.add('hidden');
    pnrTab.classList.remove('hidden');

    navPnrBtn.className = 'px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white shadow-md transition-all';
    navSearchBtn.className = 'px-4 py-2 text-sm font-semibold rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-800/50 transition-all';
  }
}

/**
 * Reset App to Home State
 */
function resetToHome() {
  switchTab('search');
  resetSearch();
}

/**
 * Toast Notification Utility
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  
  const bgColors = {
    success: 'bg-emerald-600 text-white shadow-emerald-500/20',
    error: 'bg-red-600 text-white shadow-red-500/20',
    warning: 'bg-amber-500 text-white shadow-amber-500/20',
    info: 'bg-slate-900 text-white shadow-slate-900/20'
  };

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-triangle-exclamation',
    warning: 'fa-circle-exclamation',
    info: 'fa-circle-info'
  };

  toast.className = `pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold transform transition-all duration-300 translate-y-2 opacity-0 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} text-sm"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Animate In
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  // Remove after 3.5 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3500);
}
