/**
 * Steps for the Notification System design.
 *
 * Story arc:
 *   1. Overview
 *   2. Upstream service triggers notification
 *   3. Notification Service checks user preferences
 *   4. Fan-out — one message per channel published to queues
 *   5. Push worker dispatches to APNs/FCM
 *   6. Email worker dispatches via SendGrid
 *   7. SMS worker dispatches via Twilio
 *   8. Delivery tracking + receipt
 *   9. Retry on failure / dead-letter queue
 *   10. Rate limiting + deduplication
 *
 * Node IDs: apiServer | notifSvc | prefStore | mq | pushWorker | emailWorker | smsWorker | apns | sendgrid | twilio | user
 */
export function buildNotificationSystemSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      message: 'Meet the Notification System',
      detail: 'A notification system sends millions of push notifications, emails, and SMS messages per day. The key design goals: decouple senders from delivery (queues), respect user preferences, handle third-party provider failures gracefully, and never lose a notification — even if a worker crashes mid-delivery.',
    },
    {
      type: 'trigger',
      activeNodes: ['apiServer', 'notifSvc'],
      connections: { 'apiServer-notifSvc': 'request' },
      message: 'Upstream service triggers a notification',
      detail: 'OrderService, SocialService, or MarketingService calls the Notification Service API with: { user_id, type: "order_shipped", channels: ["push", "email"], payload }. The caller does not know about APNs, FCM, or SendGrid — it just says "notify this user." The Notification Service owns all delivery complexity.',
    },
    {
      type: 'pref-check',
      activeNodes: ['notifSvc', 'prefStore'],
      connections: { 'notifSvc-prefStore': 'request' },
      message: 'Check user preferences and quiet hours',
      detail: 'The Notification Service looks up the user\'s preferences: opted-in channels, quiet hours (9pm–8am), and per-category opt-outs. Marketing push? Check opt-in. Security alert? Override quiet hours. Preferences are stored in Redis or DynamoDB for low-latency reads — this check happens on every notification.',
    },
    {
      type: 'fanout',
      activeNodes: ['notifSvc', 'mq'],
      connections: { 'notifSvc-mq': 'request' },
      message: 'Fan-out: publish one message per channel to queues',
      detail: 'The Notification Service publishes separate messages to channel-specific queues: push_queue, email_queue, sms_queue. Each queue has its own worker pool scaled independently — push workers scale to thousands (cheap API calls), SMS workers scale to hundreds (expensive per-message cost). Kafka or SQS provides durability and at-least-once delivery guarantees.',
    },
    {
      type: 'push-dispatch',
      activeNodes: ['mq', 'pushWorker', 'apns'],
      connections: { 'mq-pushWorker': 'request', 'pushWorker-apns': 'request' },
      message: 'Push worker dispatches to APNs (iOS) / FCM (Android)',
      detail: 'The push worker dequeues a message, looks up the user\'s device tokens, and calls APNs (iOS) or FCM (Android). The request includes the device token, notification title/body, and a priority (high for real-time, normal for background). APNs and FCM handle the last mile to the device.',
    },
    {
      type: 'email-dispatch',
      activeNodes: ['mq', 'emailWorker', 'sendgrid'],
      connections: { 'mq-emailWorker': 'request', 'emailWorker-sendgrid': 'request' },
      message: 'Email worker dispatches via SendGrid / SES',
      detail: 'The email worker dequeues, renders the HTML template with the user\'s name and order details, and calls SendGrid or AWS SES. Email volume is typically highest (marketing blasts) but latency tolerance is also highest — a 5-second delivery delay is acceptable. The email queue can be processed at a controlled rate to avoid provider rate limits.',
    },
    {
      type: 'sms-dispatch',
      activeNodes: ['mq', 'smsWorker', 'twilio'],
      connections: { 'mq-smsWorker': 'request', 'smsWorker-twilio': 'request' },
      message: 'SMS worker dispatches via Twilio',
      detail: 'SMS is the most expensive channel ($0.0075/message at Twilio rates) and has the strictest rate limits. Reserve SMS for high-priority, time-sensitive notifications: OTP codes, fraud alerts, shipping updates. The SMS queue is typically kept small and workers are rate-limited per destination number to avoid carrier blacklisting.',
    },
    {
      type: 'delivery-tracking',
      activeNodes: ['apns', 'pushWorker', 'notifSvc'],
      connections: { 'apns-pushWorker': 'response', 'pushWorker-notifSvc': 'response' },
      message: 'Delivery tracking — receipt logged',
      detail: 'APNs returns a delivery receipt (or error code) for each notification. The push worker logs the result: { notification_id, user_id, channel, status: "delivered" | "failed", timestamp }. This enables dashboard observability and SLO tracking. A sudden drop in APNs delivery rate often means a broken provider API key, not a code bug.',
    },
    {
      type: 'retry',
      activeNodes: ['pushWorker', 'mq', 'apns'],
      connections: { 'pushWorker-mq': 'request', 'pushWorker-apns': 'request' },
      message: 'Retry on failure — exponential backoff + dead-letter queue',
      detail: 'If APNs returns a 5xx error or times out, the worker retries with exponential backoff (1s, 2s, 4s, 8s...). After max retries, the message moves to a dead-letter queue (DLQ) for manual inspection. Idempotency is critical: each notification has a unique notification_id used as an idempotency key — retries cannot produce duplicate sends.',
    },
    {
      type: 'rate-limit',
      activeNodes: ['notifSvc', 'prefStore', 'mq'],
      connections: { 'notifSvc-prefStore': 'request', 'notifSvc-mq': 'request' },
      message: 'Rate limiting and deduplication — no notification storms',
      detail: 'If 10,000 events trigger simultaneous notifications for the same user, the Notification Service collapses them into one summary. A Redis SET keyed by user_id + notification_type with a 60s TTL acts as the deduplication window — second identical notification in 60s is dropped. Per-user rate limits (e.g. max 10 push/hour) prevent overwhelming users and damaging engagement metrics.',
    },
  ]
}
