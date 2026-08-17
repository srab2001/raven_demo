import type { FeedbackTicket } from '../lib/types'

export default function AuditTicketList({ tickets }: { tickets: FeedbackTicket[] }) {
  return (
    <section className="panel audit-panel" data-tour="audit-trail">
      <h2>Disagree audit trail</h2>
      <p className="subtext">
        Every "I disagree" submission lands here — the same append-only posture as Demo 3's ship-checklist
        audit trail, backed by the same Postgres instance as the rest of this site.
      </p>
      {tickets.length === 0 ? (
        <p className="empty-note">No feedback tickets yet — submit one from the Explanation Card above.</p>
      ) : (
        <table className="audit-table">
          <thead>
            <tr>
              <th scope="col">Ticket</th>
              <th scope="col">Recommendation</th>
              <th scope="col">Reason</th>
              <th scope="col">Routed to</th>
              <th scope="col">Status</th>
              <th scope="col">Filed</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.ticketId}>
                <td>{ticket.ticketId}</td>
                <td>{ticket.recommendationId}</td>
                <td>{ticket.reason}</td>
                <td>{ticket.routedTo.join(', ')}</td>
                <td>{ticket.status}</td>
                <td>{new Date(ticket.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
