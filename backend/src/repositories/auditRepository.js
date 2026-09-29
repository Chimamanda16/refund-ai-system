export async function insertAuditEvents(client, refundId, events) {
  for (const event of events) {
    await client.query(`INSERT INTO audit_logs
      (refund_request_id, actor_type, action, new_status, reason, metadata)
      VALUES ($1, 'system', $2, $3, $4, $5::jsonb)`,
    [refundId, event.action, event.status, event.reason, JSON.stringify(event.metadata ?? {})]);
  }
}
