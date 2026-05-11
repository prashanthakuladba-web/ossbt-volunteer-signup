const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
}

export function formatTime(isoString) {
  const d = new Date(isoString);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
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
