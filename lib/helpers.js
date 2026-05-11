const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
}

export function formatTime(isoString) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

export function formatSlotTime(startIso, endIso) {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

// Returns how many confirmed spots are still open for a slot,
// given an array of that slot's signups.
export function spotsLeft(slot, signups = []) {
  const confirmed = signups.filter(s => s.slot_id === slot.id && s.status === 'confirmed').length;
  return slot.max_capacity - confirmed;
}

// Builds the summary object returned by POST /api/signups and stored
// in router.query when navigating to the confirmation page.
export function buildSignupSummary({ event, slot, signupId, baseUrl }) {
  const d = new Date(event.event_date);
  return {
    signup_id: signupId,
    event: {
      id: event.id,
      title: event.title,
      location: event.location || '',
      date: event.event_date,
      day: DAYS[d.getUTCDay()],
      formatted_date: formatDate(event.event_date),
    },
    slot: {
      title: slot.title,
      time: formatSlotTime(slot.start_time, slot.end_time),
    },
    signup_link: `${baseUrl}/events/${event.id}`,
  };
}
