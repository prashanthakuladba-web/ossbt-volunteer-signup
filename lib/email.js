import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function sendVolunteerConfirmation(to, { eventTitle, formattedDate, location, slotTitle, slotTime }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're signed up! ${eventTitle}`,
    html: `
      <h2>You're confirmed!</h2>
      <p>Hi there, you're all set for <strong>${eventTitle}</strong>.</p>
      <table cellpadding="8" style="border-collapse:collapse">
        <tr><td><strong>Date</strong></td><td>${formattedDate}</td></tr>
        ${location ? `<tr><td><strong>Location</strong></td><td>${location}</td></tr>` : ''}
        <tr><td><strong>Slot</strong></td><td>${slotTitle}</td></tr>
        <tr><td><strong>Time</strong></td><td>${slotTime}</td></tr>
      </table>
      <p>See you there!</p>
    `,
  });
}

export async function sendCertificate(to, { name, hoursDisplay, certBuffer, cc }) {
  await resend.emails.send({
    from: FROM,
    to,
    ...(cc ? { cc } : {}),
    subject: 'Thank you for volunteering! Your certificate is attached.',
    html: `
      <h2>Thank you, ${name}!</h2>
      <p>We truly appreciate your dedicated volunteer service at Om Sri Sai Balaji Temple and Cultural Center.</p>
      <p>You volunteered <strong>${hoursDisplay}</strong>. Please find your Certificate of Appreciation attached.</p>
    `,
    attachments: [
      {
        filename: 'Certificate-of-Appreciation.jpg',
        content: certBuffer,
      },
    ],
  });
}

export async function sendOrganizerNotification(to, { eventTitle, formattedDate, volunteerEmail, volunteerPhone, slotTitle, slotTime }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `New signup: ${volunteerEmail} — ${eventTitle}`,
    html: `
      <h2>New volunteer signup</h2>
      <p>Someone just signed up for <strong>${eventTitle}</strong>.</p>
      <table cellpadding="8" style="border-collapse:collapse">
        <tr><td><strong>Volunteer</strong></td><td>${volunteerEmail}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${volunteerPhone}</td></tr>
        <tr><td><strong>Slot</strong></td><td>${slotTitle}</td></tr>
        <tr><td><strong>Time</strong></td><td>${slotTime}</td></tr>
        <tr><td><strong>Date</strong></td><td>${formattedDate}</td></tr>
      </table>
    `,
  });
}
