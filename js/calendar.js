// Calendar event (.ics) download for the trip.
function downloadCalendarEvent() {
    const event = {
        title: "Ottó Legénybúcsúja — Prague",
        description: "Last Ride in Prague! 🍻\\n\\nTalálkozunk Prágában!\\n\\nRészletek: https://otto-bachelor-party.up.railway.app",
        location: "Prague, Czech Republic",
        startDate: new Date('2026-05-07T12:00:00'),
        endDate: new Date('2026-05-10T18:00:00')
    };

    const formatDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, -1);
    };

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Otto Bachelor Party//EN',
        'BEGIN:VEVENT',
        `DTSTART:${formatDate(event.startDate)}`,
        `DTEND:${formatDate(event.endDate)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description}`,
        `LOCATION:${event.location}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'otto-legenybucsuja-prague-2026.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.toast) {
        window.toast.success('Naptár esemény letöltve!', { icon: '📅' });
    }
}

window.downloadCalendarEvent = downloadCalendarEvent;
