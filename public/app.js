const API_BASE = '/api/carrent/v1';

const state = {
  token: localStorage.getItem('readygo-token') || '',
  user: null,
  cars: [],
  pendingReservation: null,
  pendingPayment: null,
};

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
});

const formElements = {
  loginForm: document.querySelector('#loginForm'),
  registerForm: document.querySelector('#registerForm'),
  bookingForm: document.querySelector('#bookingForm'),
  accountState: document.querySelector('#accountState'),
  myReservationsList: document.querySelector('#myReservationsList'),
  carsGrid: document.querySelector('#carsGrid'),
  bookingCarSelect: document.querySelector('#bookingCarSelect'),
  bookingSummary: document.querySelector('#bookingSummary'),
  accountName: document.querySelector('#accountName'),
  fleetCount: document.querySelector('#fleetCount'),
  avgPrice: document.querySelector('#avgPrice'),
  availableCount: document.querySelector('#availableCount'),
  toast: document.querySelector('#toast'),
};

const managedModules = {
  cars: {
    title: 'Cars',
    endpoint: 'cars',
    columns: [
      ['ID', (row) => row.id],
      ['Vehicle', (row) => `${row.brand} ${row.model}`],
      ['Plate', (row) => row.plateNumber],
      ['Year', (row) => row.year],
      ['Daily rate', (row) => formatPrice(row.dailyRate)],
      ['Status', (row) => row.status],
      ['Mileage (km)', (row) => Number(row.mileage || 0).toLocaleString('en-PH')],
    ],
    fields: [
      { name: 'brand', label: 'Brand', required: true },
      { name: 'model', label: 'Model', required: true },
      { name: 'plateNumber', label: 'Plate number', required: true },
      { name: 'year', label: 'Year', type: 'number', required: true, min: 1900 },
      { name: 'dailyRate', label: 'Daily rate (PHP)', type: 'number', required: true, min: 0, step: '0.01' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: ['available', 'rented', 'maintenance'] },
      { name: 'mileage', label: 'Mileage (km)', type: 'number', min: 0, optional: true },
      { name: 'imageUrl', label: 'Car photo', type: 'image', optional: true },
    ],
  },
  customers: {
    title: 'Customers',
    endpoint: 'customers',
    columns: [
      ['ID', (row) => row.id],
      ['Name', (row) => row.fullName],
      ['Email', (row) => row.email],
      ['Phone', (row) => row.phone],
      ['Address', (row) => row.address],
    ],
    fields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true, optionalOnEdit: true },
      { name: 'phone', label: 'Phone', type: 'tel', optional: true },
      { name: 'address', label: 'Address', optional: true },
    ],
  },
  admins: {
    title: 'Admins',
    endpoint: 'admins',
    columns: [
      ['ID', (row) => row.id],
      ['Name', (row) => row.fullName],
      ['Email', (row) => row.email],
      ['Phone', (row) => row.phone],
      ['Active', (row) => row.isActive ? 'Yes' : 'No'],
    ],
    fields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true, optionalOnEdit: true },
      { name: 'phone', label: 'Phone', type: 'tel', optional: true },
    ],
  },
  reservations: {
    title: 'Reservations',
    endpoint: 'reservations',
    columns: [
      ['ID', (row) => row.id],
      ['Customer', (row) => row.customer?.fullName || `#${row.customer?.id || row.customerId || ''}`],
      ['Vehicle', (row) => row.car ? `${row.car.brand} ${row.car.model}` : `#${row.carId || ''}`],
      ['Pickup location', (row) => row.pickupLocation],
      ['Pickup', (row) => row.startDate],
      ['Return', (row) => row.endDate],
      ['Total', (row) => formatPrice(row.totalPrice)],
      ['Status', (row) => row.status],
    ],
    fields: [
      { name: 'customerId', label: 'Customer', type: 'select', source: 'customers', required: true },
      { name: 'carId', label: 'Car', type: 'select', source: 'cars', required: true },
      { name: 'pickupLocation', label: 'Pick-up location', type: 'select', options: ['Makati City', 'BGC, Taguig', 'NAIA, Pasay', 'Cebu City', 'Davao City', 'Clark, Pampanga', 'Iloilo City'], optional: true },
      { name: 'startDate', label: 'Pick-up date', type: 'date', required: true },
      { name: 'endDate', label: 'Return date', type: 'date', required: true },
      { name: 'totalPrice', label: 'Total (PHP)', type: 'number', min: 0, step: '0.01', optional: true },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'confirmed', 'cancelled', 'completed'], optional: true },
    ],
  },
  payments: {
    title: 'Payments',
    endpoint: 'payments',
    columns: [
      ['ID', (row) => row.id],
      ['Reservation', (row) => `#${row.reservation?.id || row.reservationId || ''}`],
      ['Amount', (row) => formatPrice(row.amount)],
      ['Method', (row) => row.paymentMethod],
      ['Status', (row) => row.status],
    ],
    fields: [
      { name: 'reservationId', label: 'Reservation', type: 'select', source: 'reservations', required: true },
      { name: 'amount', label: 'Amount (PHP)', type: 'number', min: 0, step: '0.01', required: true },
      { name: 'paymentMethod', label: 'Payment method', type: 'select', options: ['cash', 'GCash', 'Maya', 'card', 'bank transfer'], optional: true },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'paid', 'failed', 'refunded'], optional: true },
    ],
  },
  'rental-records': {
    title: 'Rental records',
    endpoint: 'rental-records',
    columns: [
      ['ID', (row) => row.id],
      ['Reservation', (row) => `#${row.reservation?.id || row.reservationId || ''}`],
      ['Pickup', (row) => formatDateTime(row.pickupDate)],
      ['Return', (row) => formatDateTime(row.returnDate)],
      ['Charges', (row) => formatPrice(row.totalCharges)],
      ['Condition notes', (row) => row.conditionNotes],
    ],
    fields: [
      { name: 'reservationId', label: 'Reservation', type: 'select', source: 'reservations', required: true },
      { name: 'pickupDate', label: 'Pick-up date and time', type: 'datetime-local', optional: true },
      { name: 'returnDate', label: 'Return date and time', type: 'datetime-local', optional: true },
      { name: 'conditionNotes', label: 'Condition notes', type: 'textarea', optional: true },
      { name: 'totalCharges', label: 'Total charges (PHP)', type: 'number', min: 0, step: '0.01', optional: true },
    ],
  },
};

const managerState = {
  module: 'cars',
  records: [],
  lookups: {},
  editingId: null,
};

let adminSetupAvailable = false;

const showToast = (message) => {
  const toast = formElements.toast;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2600);
};

const formatPrice = (value) => currencyFormatter.format(Number(value || 0));

const formatReservationDate = (value) => {
  if (!value) {
    return '—';
  }

  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(date);
};

const createPasswordControl = (input) => {
  const control = document.createElement('div');
  control.className = 'password-control';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'password-toggle';
  toggle.setAttribute('aria-label', 'Show password');
  toggle.setAttribute('aria-pressed', 'false');

  const renderIcon = (visible) => {
    toggle.innerHTML = visible
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0112 5c5.5 0 9 7 9 7a14.8 14.8 0 01-3.1 3.8M6.2 6.2C3.9 7.8 2 12 2 12s3.5 7 10 7a10.7 10.7 0 004-.8"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  };

  toggle.addEventListener('click', () => {
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    toggle.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} password`);
    toggle.setAttribute('aria-pressed', String(visible));
    renderIcon(visible);
  });

  renderIcon(false);
  control.append(input, toggle);
  return control;
};

const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const manilaDateTimeInput = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
};

const manilaDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const addDays = (dateString, days) => {
  if (!dateString) {
    return '';
  }

  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const rentalDays = (pickup, returnDate) => {
  const start = Date.parse(`${pickup}T00:00:00Z`);
  const end = Date.parse(`${returnDate}T00:00:00Z`);
  return Math.ceil((end - start) / 86_400_000);
};

const renderSummaryStats = () => {
  formElements.fleetCount.textContent = String(state.cars.length);

  if (!state.cars.length) {
    formElements.avgPrice.textContent = '$0';
    formElements.availableCount.textContent = '0';
    return;
  }

  const prices = state.cars.map((car) => Number(car.dailyRate || 0));
  const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const available = state.cars.filter((car) => (car.status || '').toLowerCase() === 'available').length;

  formElements.avgPrice.textContent = formatPrice(avg);
  formElements.availableCount.textContent = String(available);
};

const renderCars = () => {
  formElements.carsGrid.innerHTML = '';

  if (!state.cars.length) {
    formElements.carsGrid.innerHTML = '<p class="empty-state">No vehicles have been added to the fleet yet. Please check back soon.</p>';
    return;
  }

  for (const car of state.cars) {
    const card = document.createElement('article');
    card.className = 'car-card';
    const status = (car.status || 'available').toLowerCase();

    card.innerHTML = `
      <div class="car-visual"></div>
      <div class="car-info">
        <div class="car-head">
          <h3>${car.brand || 'Premium'} ${car.model || 'Car'}</h3>
          <span class="status-badge ${status}">${status}</span>
        </div>
        <div class="car-meta">
          <span>${car.plateNumber || 'N/A'}</span>
          <span>${car.year || '2024'}</span>
        </div>
        <div class="car-meta">
          <span>${Number(car.mileage || 0).toLocaleString('en-PH')} km</span>
          <span class="car-price">${formatPrice(car.dailyRate)}</span>
        </div>
        <button type="button" class="reserve-button" data-car-id="${car.id}">Reserve this vehicle</button>
      </div>
    `;

    if (car.imageUrl) {
      const visual = card.querySelector('.car-visual');
      const image = document.createElement('img');
      image.src = car.imageUrl;
      image.alt = `${car.brand || 'Car'} ${car.model || ''}`.trim();
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        image.remove();
        visual.classList.remove('has-image');
      });
      visual.classList.add('has-image');
      visual.appendChild(image);
    }

    const reserveButton = card.querySelector('.reserve-button');
    if (status !== 'available') {
      reserveButton.disabled = true;
      reserveButton.textContent = 'Not available';
    }
    reserveButton.addEventListener('click', () => {
      formElements.bookingCarSelect.value = String(car.id);
      state.pendingReservation = null;
      formElements.bookingSummary.textContent = `${car.brand} ${car.model} selected. Choose your dates and get a trip estimate to continue.`;
      showToast(`${car.brand} ${car.model} selected for booking.`);
    });

    formElements.carsGrid.appendChild(card);
  }
};

const updateBookingSelect = () => {
  formElements.bookingCarSelect.innerHTML = '<option value="">Choose a vehicle</option>';

  for (const car of state.cars) {
    const option = document.createElement('option');
    option.value = String(car.id);
    option.textContent = `${car.brand} ${car.model} — ${formatPrice(car.dailyRate)}`;
    formElements.bookingCarSelect.appendChild(option);
  }
};

const toggleAuthTab = (tabName) => {
  document.querySelectorAll('.tab').forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  document.querySelectorAll('.auth-form').forEach((form) => {
    form.classList.toggle('active', form.id === `${tabName}Form`);
  });
};

const updateAccountState = () => {
  const isLoggedIn = !!state.user;
  const isCustomer = state.user?.role === 'customer';
  const isAdmin = state.user?.role === 'admin';
  formElements.accountState.classList.toggle('hidden', !isLoggedIn);
  document.querySelector('#account').hidden = isLoggedIn;
  document.querySelector('.dashboard-grid').classList.toggle('is-logged-in', isLoggedIn);
  document.querySelector('#myReservations').hidden = !isCustomer;
  document.querySelector('#myReservationsNavLink').hidden = !isCustomer;
  document.querySelectorAll('a[href="#account"], a[href="#accountState"]').forEach((link) => {
    link.href = isLoggedIn ? '#accountState' : '#account';
  });
  document.querySelector('#adminSetup').classList.toggle('hidden', !adminSetupAvailable || isAdmin);
  document.querySelector('#management').hidden = !isAdmin;
  document.querySelector('#managementNavLink').hidden = !isAdmin;

  if (isLoggedIn) {
    const initials = (state.user.fullName || state.user.email || 'R')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    document.querySelector('#accountAvatar').textContent = initials;
    formElements.accountName.textContent = state.user.fullName || state.user.email || 'ReadyGo member';
  }
};

const apiRequest = async (url, options = {}) => {
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
};

const renderMyReservations = (reservations) => {
  formElements.myReservationsList.replaceChildren();

  if (reservations.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'You do not have any reservations yet.';
    formElements.myReservationsList.appendChild(emptyState);
    return;
  }

  for (const reservation of reservations) {
    const card = document.createElement('article');
    card.className = 'reservation-card';

    const heading = document.createElement('div');
    heading.className = 'reservation-card-header';

    const title = document.createElement('h3');
    title.textContent = `Reservation #${reservation.id} · ${reservation.car ? `${reservation.car.brand} ${reservation.car.model}` : 'Vehicle details unavailable'}`;
    heading.appendChild(title);

    const status = document.createElement('span');
    status.className = 'status-badge reservation-status';
    status.textContent = reservation.status || 'unknown';
    heading.appendChild(status);

    const details = document.createElement('dl');
    details.className = 'reservation-details';

    const fields = [
      ['Pick-up date', formatReservationDate(reservation.startDate)],
      ['Return date', formatReservationDate(reservation.endDate)],
      ['Pick-up location', reservation.pickupLocation || '—'],
      ['Total', formatPrice(reservation.totalPrice)],
    ];

    for (const [label, value] of fields) {
      const item = document.createElement('div');
      item.className = 'reservation-detail';
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value;
      item.append(term, description);
      details.appendChild(item);
    }

    card.append(heading, details);
    formElements.myReservationsList.appendChild(card);
  }
};

const fetchMyReservations = async () => {
  formElements.myReservationsList.textContent = 'Loading your reservations…';
  try {
    const reservations = await apiRequest(`${API_BASE}/reservations/mine`);
    if (!Array.isArray(reservations)) {
      throw new Error('The reservations response was invalid.');
    }
    renderMyReservations(reservations);
  } catch (error) {
    formElements.myReservationsList.textContent = 'Unable to load your reservations. Please try again.';
    showToast(error.message || 'Unable to load your reservations.');
  }
};

const loadProfile = async () => {
  if (!state.token) {
    state.user = null;
    updateAccountState();
    return;
  }

  try {
    const profile = await apiRequest(`${API_BASE}/auth/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${state.token}`,
      },
    });
    state.user = profile;
    updateAccountState();
    if (state.user?.role === 'customer') {
      await fetchMyReservations();
    } else if (state.user?.role === 'admin') {
      await selectManagedModule(managerState.module);
    }
  } catch (error) {
    state.token = '';
    localStorage.removeItem('readygo-token');
    state.user = null;
    updateAccountState();
    showToast('Your session expired. Please log in again.');
  }
};

const fetchCars = async () => {
  try {
    const cars = await apiRequest(`${API_BASE}/cars`);
    state.cars = Array.isArray(cars) ? cars : [];
    renderCars();
    updateBookingSelect();
    renderSummaryStats();
  } catch (error) {
    showToast(error.message || 'Unable to load fleet data.');
    state.cars = [];
    renderCars();
    renderSummaryStats();
  }
};

const checkAdminSetup = async () => {
  try {
    const admins = await apiRequest(`${API_BASE}/admins`);
    adminSetupAvailable = Array.isArray(admins) && admins.length === 0;
    document.querySelector('#adminSetup').classList.toggle('hidden', !adminSetupAvailable || state.user?.role === 'admin');
  } catch (error) {
    showToast(error.message || 'Unable to check administrator setup.');
  }
};

const handleAdminSetup = async (event) => {
  event.preventDefault();
  const payload = {
    fullName: document.querySelector('#adminSetupName').value.trim(),
    email: document.querySelector('#adminSetupEmail').value.trim(),
    password: document.querySelector('#adminSetupPassword').value,
    phone: document.querySelector('#adminSetupPhone').value.trim() || undefined,
  };

  try {
    await apiRequest(`${API_BASE}/admins`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const auth = await apiRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    });
    state.token = auth.accessToken || auth.access_token || auth.token || '';
    if (!state.token) {
      throw new Error('Admin was created, but login did not return an access token.');
    }
    localStorage.setItem('readygo-token', state.token);
    adminSetupAvailable = false;
    document.querySelector('#adminSetupForm').reset();
    showToast('Admin account created. You are signed in.');
    await loadProfile();
  } catch (error) {
    showToast(error.message || 'Unable to create the admin account.');
  }
};

const managerElements = {
  section: document.querySelector('#management'),
  head: document.querySelector('#managerTableHead'),
  body: document.querySelector('#managerTableBody'),
  search: document.querySelector('#managerSearch'),
  feedback: document.querySelector('#managerFeedback'),
  dialog: document.querySelector('#recordDialog'),
  form: document.querySelector('#recordForm'),
  fields: document.querySelector('#recordFields'),
};

const relationValue = (record, fieldName) => {
  if (record[fieldName] !== undefined) {
    return record[fieldName];
  }

  const relationName = fieldName.replace(/Id$/, '');
  return record[relationName]?.id ?? '';
};

const relationOptionLabel = (resource, record) => {
  if (resource === 'customers') {
    return `${record.fullName} · ${record.email}`;
  }
  if (resource === 'cars') {
    return `${record.brand} ${record.model} · ${record.plateNumber}`;
  }
  return `Reservation #${record.id} · ${record.car?.brand || ''} ${record.car?.model || ''}`.trim();
};

const loadManagedRecords = async () => {
  const config = managedModules[managerState.module];
  managerElements.feedback.textContent = 'Loading records…';

  try {
    const records = await apiRequest(`${API_BASE}/${config.endpoint}`);
    managerState.records = Array.isArray(records) ? records : [];
    renderManagedTable();
  } catch (error) {
    managerElements.feedback.textContent = 'Unable to load records.';
    showToast(error.message || `Unable to load ${config.title.toLowerCase()}.`);
  }
};

const renderManagedTable = () => {
  const config = managedModules[managerState.module];
  managerElements.head.replaceChildren();
  managerElements.body.replaceChildren();
  managerElements.feedback.textContent = `${managerState.records.length} ${config.title.toLowerCase()} record${managerState.records.length === 1 ? '' : 's'}`;

  const headerRow = document.createElement('tr');
  for (const [label] of config.columns) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = label;
    headerRow.appendChild(cell);
  }
  const actionHeader = document.createElement('th');
  actionHeader.scope = 'col';
  actionHeader.textContent = 'Actions';
  headerRow.appendChild(actionHeader);
  managerElements.head.appendChild(headerRow);

  const query = managerElements.search.value.trim().toLowerCase();
  const filtered = managerState.records.filter((record) =>
    config.columns.some(([, getValue]) => String(getValue(record) ?? '').toLowerCase().includes(query)),
  );

  if (!filtered.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = config.columns.length + 1;
    cell.className = 'manager-empty';
    cell.textContent = managerState.records.length ? 'No records match your search.' : 'No records yet. Add a record to get started.';
    row.appendChild(cell);
    managerElements.body.appendChild(row);
    return;
  }

  for (const record of filtered) {
    const row = document.createElement('tr');
    for (const [, getValue] of config.columns) {
      const cell = document.createElement('td');
      cell.textContent = String(getValue(record) ?? '—');
      row.appendChild(cell);
    }

    const actionsCell = document.createElement('td');
    actionsCell.className = 'manager-actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'table-action';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => openRecordDialog(record));
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'table-action danger-action';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteManagedRecord(record));
    actionsCell.append(editButton, deleteButton);
    row.appendChild(actionsCell);
    managerElements.body.appendChild(row);
  }
};

const loadFieldLookups = async (config) => {
  const resources = [...new Set(config.fields.map((field) => field.source).filter(Boolean))];
  await Promise.all(resources.map(async (resource) => {
    const response = await apiRequest(`${API_BASE}/${managedModules[resource].endpoint}`);
    managerState.lookups[resource] = Array.isArray(response) ? response : [];
  }));
};

const createCarImageField = (field, record) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'record-field image-field';
  const label = document.createElement('span');
  label.textContent = field.label;

  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.name = field.name;
  urlInput.id = `record-${field.name}`;
  urlInput.setAttribute('aria-label', 'Car image URL');
  urlInput.placeholder = 'Paste an image URL or upload a photo';
  urlInput.value = String(record?.imageUrl || '');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/jpeg,image/png,image/webp';
  fileInput.setAttribute('aria-label', 'Choose a car photo');
  const preview = document.createElement('img');
  preview.className = 'image-preview';
  preview.alt = 'Car photo preview';
  preview.hidden = !urlInput.value;
  if (urlInput.value) {
    preview.src = urlInput.value;
  }

  const help = document.createElement('small');
  help.textContent = 'JPG, PNG, or WebP · maximum 5 MB';
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      fileInput.value = '';
      showToast('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      fileInput.value = '';
      showToast('Choose an image smaller than 5 MB.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    preview.src = localPreview;
    preview.hidden = false;
    fileInput.disabled = true;
    document.querySelector('#saveRecordBtn').disabled = true;
    help.textContent = 'Uploading photo…';

    try {
      const body = new FormData();
      body.append('image', file);
      const result = await apiRequest(`${API_BASE}/cars/upload-image`, {
        method: 'POST',
        body,
      });
      if (typeof result.url !== 'string' || !result.url) {
        throw new Error('The image upload did not return a URL.');
      }
      urlInput.value = result.url;
      preview.src = result.url;
      help.textContent = 'Photo uploaded. Save the car record to apply it.';
    } catch (error) {
      help.textContent = 'Upload failed. Choose the photo again to retry.';
      fileInput.value = '';
      preview.hidden = !urlInput.value;
      if (urlInput.value) preview.src = urlInput.value;
      showToast(error.message || 'Unable to upload the car photo.');
    } finally {
      URL.revokeObjectURL(localPreview);
      fileInput.disabled = false;
      document.querySelector('#saveRecordBtn').disabled = false;
    }
  });

  wrapper.append(label, urlInput, fileInput, help, preview);
  return wrapper;
};

const createRecordField = (field, record) => {
  if (field.type === 'image') {
    return createCarImageField(field, record);
  }

  const wrapper = document.createElement('label');
  wrapper.className = 'record-field';
  wrapper.textContent = field.label;
  let input;
  const value = record ? relationValue(record, field.name) : '';

  if (field.type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 3;
  } else if (field.type === 'select') {
    input = document.createElement('select');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = field.source ? 'Choose a record' : 'Choose an option';
    input.appendChild(placeholder);

    const options = field.source ? managerState.lookups[field.source] || [] : field.options || [];
    for (const optionItem of options) {
      const option = document.createElement('option');
      if (field.source) {
        option.value = String(optionItem.id);
        option.textContent = relationOptionLabel(field.source, optionItem);
      } else {
        option.value = optionItem;
        option.textContent = optionItem;
      }
      input.appendChild(option);
    }
  } else {
    input = document.createElement('input');
    input.type = field.type || 'text';
    if (field.min !== undefined) input.min = String(field.min);
    if (field.step) input.step = field.step;
  }

  input.name = field.name;
  input.id = `record-${field.name}`;
  input.value = field.type === 'datetime-local' && value
    ? manilaDateTimeInput(value)
    : field.type === 'date' && value
      ? String(value).slice(0, 10)
      : String(value ?? '');
  input.required = Boolean(field.required && !(field.optionalOnEdit && record));
  if (field.source && value !== '') {
    input.value = String(value);
  }
  wrapper.appendChild(input.type === 'password' ? createPasswordControl(input) : input);

  if (field.optionalOnEdit && record) {
    const hint = document.createElement('small');
    hint.textContent = 'Leave blank to keep the current password.';
    wrapper.appendChild(hint);
  }

  return wrapper;
};

const openRecordDialog = async (record = null) => {
  if (state.user?.role !== 'admin') {
    showToast('Sign in with an admin account to manage records.');
    return;
  }

  const config = managedModules[managerState.module];
  managerState.editingId = record?.id ?? null;
  managerElements.form.reset();
  managerElements.fields.replaceChildren();

  try {
    await loadFieldLookups(config);
    document.querySelector('#recordDialogTitle').textContent = `${record ? 'Edit' : 'Add'} ${config.title.toLowerCase().replace(/s$/, '')}`;
    for (const field of config.fields) {
      managerElements.fields.appendChild(createRecordField(field, record));
    }
    managerElements.dialog.showModal();
  } catch (error) {
    showToast(error.message || 'Unable to prepare the form.');
  }
};

const saveManagedRecord = async (event) => {
  event.preventDefault();
  const config = managedModules[managerState.module];
  const payload = {};

  for (const field of config.fields) {
    const input = managerElements.form.elements.namedItem(field.name);
    const value = input.value.trim();
    if (value === '') {
      continue;
    }
    payload[field.name] = field.type === 'number' || field.source
      ? Number(value)
      : value;
  }

  const isEditing = managerState.editingId !== null;
  const url = `${API_BASE}/${config.endpoint}${isEditing ? `/${managerState.editingId}` : ''}`;

  try {
    await apiRequest(url, {
      method: isEditing ? 'PATCH' : 'POST',
      body: JSON.stringify(payload),
    });
    managerElements.dialog.close();
    showToast(`${config.title.slice(0, -1)} ${isEditing ? 'updated' : 'created'}.`);
    await loadManagedRecords();
    if (managerState.module === 'cars') {
      await fetchCars();
    }
  } catch (error) {
    showToast(error.message || 'Unable to save this record.');
  }
};

const deleteManagedRecord = async (record) => {
  const config = managedModules[managerState.module];
  if (!window.confirm(`Delete ${config.title.toLowerCase().replace(/s$/, '')} #${record.id}? This cannot be undone.`)) {
    return;
  }

  try {
    await apiRequest(`${API_BASE}/${config.endpoint}/${record.id}`, { method: 'DELETE' });
    showToast('Record deleted.');
    await loadManagedRecords();
    if (managerState.module === 'cars') {
      await fetchCars();
    }
  } catch (error) {
    showToast(error.message || 'Unable to delete this record.');
  }
};

const selectManagedModule = async (moduleName) => {
  if (!managedModules[moduleName]) {
    return;
  }

  managerState.module = moduleName;
  document.querySelectorAll('.manager-tab').forEach((tab) => {
    const isActive = tab.dataset.module === moduleName;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
  managerElements.search.value = '';
  await loadManagedRecords();
};

const initializeManagement = () => {
  document.querySelectorAll('.manager-tab').forEach((tab) => {
    tab.addEventListener('click', () => selectManagedModule(tab.dataset.module));
  });
  document.querySelector('#newRecordBtn').addEventListener('click', () => openRecordDialog());
  managerElements.search.addEventListener('input', renderManagedTable);
  managerElements.form.addEventListener('submit', saveManagedRecord);
  document.querySelector('#closeRecordDialog').addEventListener('click', () => managerElements.dialog.close());
  document.querySelector('#cancelRecordBtn').addEventListener('click', () => managerElements.dialog.close());
};

const handleLogin = async (event) => {
  event.preventDefault();

  const email = document.querySelector('#loginEmail').value.trim();
  const password = document.querySelector('#loginPassword').value;

  try {
    const result = await apiRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    state.token = result.accessToken || result.access_token || result.token || '';
    localStorage.setItem('readygo-token', state.token);
    showToast('Welcome back!');
    formElements.loginForm.reset();
    await loadProfile();
  } catch (error) {
    showToast(error.message || 'Login failed.');
  }
};

const handleRegister = async (event) => {
  event.preventDefault();

  const payload = {
    fullName: document.querySelector('#registerName').value.trim(),
    email: document.querySelector('#registerEmail').value.trim(),
    password: document.querySelector('#registerPassword').value,
    phone: document.querySelector('#registerPhone').value.trim() || undefined,
    address: document.querySelector('#registerAddress').value.trim() || undefined,
  };

  try {
    await apiRequest(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    showToast('Account created successfully.');
    formElements.registerForm.reset();
    toggleAuthTab('login');
    document.querySelector('#loginEmail').value = payload.email;
  } catch (error) {
    showToast(error.message || 'Registration failed.');
  }
};

const addBookingSummaryLine = (label, value) => {
  const line = document.createElement('p');
  line.className = 'booking-summary-line';
  const key = document.createElement('strong');
  key.textContent = `${label}: `;
  line.append(key, document.createTextNode(String(value)));
  formElements.bookingSummary.appendChild(line);
};

const invalidatePendingReservation = () => {
  if (!state.pendingReservation) {
    return;
  }
  state.pendingReservation = null;
  document.querySelector('#paymentSection').hidden = true;
  formElements.bookingSummary.textContent = 'Trip details changed. Generate a new estimate before confirming.';
};

const submitReservationAndPayment = async (event) => {
  event.preventDefault();

  if (state.user?.role !== 'customer') {
    showToast('Sign in with a customer account to confirm this booking.');
    return;
  }

  if (!state.pendingPayment && !state.pendingReservation) {
    showToast('Generate a trip estimate before confirming.');
    return;
  }

  const button = document.querySelector('#simulatePaymentBtn');
  const feedback = document.querySelector('#paymentFeedback');
  button.disabled = true;
  feedback.textContent = '';

  try {
    if (!state.pendingPayment) {
      const customerId = Number(state.user.sub);
      if (!Number.isSafeInteger(customerId) || customerId < 1) {
        throw new Error('Your customer session is invalid. Please sign in again.');
      }

      const booking = state.pendingReservation;
      const reservation = await apiRequest(`${API_BASE}/reservations`, {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          carId: booking.carId,
          pickupLocation: booking.pickupLocation,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
          status: 'pending',
        }),
      });

      state.pendingPayment = {
        reservationId: reservation.id,
      };
      state.pendingReservation = null;
      await fetchMyReservations();
    }

    const payment = await apiRequest(`${API_BASE}/payments/simulate`, {
      method: 'POST',
      body: JSON.stringify({
        reservationId: state.pendingPayment.reservationId,
        paymentMethod: document.querySelector('#paymentMethod').value,
      }),
    });

    feedback.textContent = `Reservation #${state.pendingPayment.reservationId} was paid in the simulation. Payment record #${payment.id} was recorded as paid; no real charge was made.`;
    document.querySelector('#paymentForm').hidden = true;
    state.pendingPayment = null;
    showToast('Demo payment recorded.');
  } catch (error) {
    feedback.textContent = state.pendingPayment
      ? 'The reservation was created, but the simulated payment failed. You can retry without creating another reservation.'
      : 'Unable to create the reservation. Please try again.';
    button.textContent = state.pendingPayment ? 'Retry simulated payment' : 'Confirm booking & simulate payment';
    showToast(error.message || 'Unable to complete the booking.');
  } finally {
    button.disabled = false;
  }
};

const handleBooking = (event) => {
  event.preventDefault();
  if (state.pendingPayment) {
    showToast(`Complete the simulated payment for reservation #${state.pendingPayment.reservationId} first.`);
    return;
  }
  state.pendingReservation = null;
  document.querySelector('#paymentSection').hidden = true;

  const selectedCarId = formElements.bookingCarSelect.value;
  const selectedCar = state.cars.find((car) => String(car.id) === selectedCarId);

  if (!selectedCar) {
    formElements.bookingSummary.textContent = 'Please choose a vehicle before confirming your reservation.';
    showToast('Select a car to continue.');
    return;
  }

  if ((selectedCar.status || '').toLowerCase() !== 'available') {
    formElements.bookingSummary.textContent = 'That vehicle is not currently available. Please choose another car.';
    showToast('Choose an available vehicle.');
    return;
  }

  const pickup = document.querySelector('#bookingPickupDate').value;
  const returnDate = document.querySelector('#bookingReturnDate').value;
  const city = document.querySelector('#bookingCity').value;
  const days = rentalDays(pickup, returnDate);

  if (!pickup || !returnDate || pickup < manilaDate() || days < 1) {
    formElements.bookingSummary.textContent = 'Choose a valid pick-up date and a return date after it.';
    showToast('Check your pick-up and return dates.');
    return;
  }

  const totalPrice = Number(selectedCar.dailyRate) * days;
  const canConfirm = Boolean(state.token && state.user?.role === 'customer');
  state.pendingReservation = canConfirm
    ? {
        carId: Number(selectedCar.id),
        pickupLocation: city,
        startDate: pickup,
        endDate: returnDate,
        totalPrice,
      }
    : null;

  formElements.bookingSummary.replaceChildren();
  const intro = document.createElement('p');
  intro.textContent = `Trip estimate for ${state.user?.email || 'guest'}.`;
  formElements.bookingSummary.appendChild(intro);
  addBookingSummaryLine('Vehicle', `${selectedCar.brand} ${selectedCar.model}`);
  addBookingSummaryLine('Pickup location', city);
  addBookingSummaryLine('Pick-up', pickup);
  addBookingSummaryLine('Return', returnDate);
  addBookingSummaryLine('Duration', `${days} ${days === 1 ? 'day' : 'days'}`);
  addBookingSummaryLine('Estimated total', formatPrice(totalPrice));

  if (canConfirm) {
    document.querySelector('#paymentForm').hidden = false;
    document.querySelector('#paymentFeedback').textContent = `Select a method to confirm this reservation and simulate payment of ${formatPrice(totalPrice)}.`;
    document.querySelector('#simulatePaymentBtn').textContent = 'Confirm booking & simulate payment';
    document.querySelector('#paymentSection').hidden = false;
  } else {
    const note = document.createElement('p');
    note.textContent = 'Sign in with a customer account to confirm this booking.';
    formElements.bookingSummary.appendChild(note);
  }

  showToast('Trip estimate is ready.');
};

const handleLogout = () => {
  state.token = '';
  state.user = null;
  state.pendingReservation = null;
  state.pendingPayment = null;
  document.querySelector('#paymentSection').hidden = true;
  localStorage.removeItem('readygo-token');
  updateAccountState();
  showToast('You have been signed out.');
};

const setInitialValues = () => {
  const pickup = manilaDate();
  const returnDate = addDays(pickup, 4);

  for (const id of ['pickupDate', 'bookingPickupDate']) {
    const input = document.querySelector(`#${id}`);
    input.value = pickup;
    input.min = pickup;
  }

  for (const id of ['returnDate', 'bookingReturnDate']) {
    const input = document.querySelector(`#${id}`);
    input.value = returnDate;
    input.min = addDays(pickup, 1);
  }
};

const initialize = async () => {
  setInitialValues();
  initializeManagement();
  document.querySelectorAll('input[type="password"]').forEach((input) => {
    const parent = input.parentElement;
    const passwordControl = createPasswordControl(input);
    parent.appendChild(passwordControl);
  });
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => toggleAuthTab(button.dataset.tab));
  });

  formElements.loginForm.addEventListener('submit', handleLogin);
  formElements.registerForm.addEventListener('submit', handleRegister);
  document.querySelector('#adminSetupForm').addEventListener('submit', handleAdminSetup);
  formElements.bookingForm.addEventListener('submit', handleBooking);
  document.querySelector('#paymentForm').addEventListener('submit', submitReservationAndPayment);
  document.querySelector('#logoutBtn').addEventListener('click', handleLogout);
  document.querySelector('#refreshReservationsBtn').addEventListener('click', fetchMyReservations);
  document.querySelector('#refreshFleetBtn').addEventListener('click', fetchCars);
  document.querySelector('#browseFleetBtn').addEventListener('click', () => document.querySelector('#fleet').scrollIntoView({ behavior: 'smooth' }));
  document.querySelector('#viewPricingBtn').addEventListener('click', () => document.querySelector('#booking').scrollIntoView({ behavior: 'smooth' }));
  document.querySelector('#headerCta').addEventListener('click', () => document.querySelector('#booking').scrollIntoView({ behavior: 'smooth' }));
  document.querySelector('#quickBookBtn').addEventListener('click', () => document.querySelector('#booking').scrollIntoView({ behavior: 'smooth' }));
  document.querySelector('#pickupDate').addEventListener('change', (event) => {
    const pickup = event.target.value;
    if (!pickup) {
      return;
    }

    invalidatePendingReservation();
    const returnInput = document.querySelector('#returnDate');
    const bookingPickupInput = document.querySelector('#bookingPickupDate');
    const bookingReturnInput = document.querySelector('#bookingReturnDate');

    returnInput.min = addDays(pickup, 1);
    bookingPickupInput.value = pickup;
    bookingPickupInput.min = pickup;
    bookingReturnInput.min = addDays(pickup, 1);
    if (returnInput.value <= pickup) {
      returnInput.value = addDays(pickup, 1);
    }
    bookingReturnInput.value = returnInput.value;
  });
  document.querySelector('#returnDate').addEventListener('change', (event) => {
    invalidatePendingReservation();
    document.querySelector('#bookingReturnDate').value = event.target.value;
  });
  document.querySelector('#pickupLocation').addEventListener('change', (event) => {
    invalidatePendingReservation();
    const citySelect = document.querySelector('#bookingCity');
    if ([...citySelect.options].some((option) => option.value === event.target.value)) {
      citySelect.value = event.target.value;
    }
  });
  ['bookingCarSelect', 'bookingPickupDate', 'bookingReturnDate', 'bookingCity'].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener('change', invalidatePendingReservation);
  });

  await fetchCars();
  await checkAdminSetup();
  await loadProfile();
  renderSummaryStats();
};

initialize();
