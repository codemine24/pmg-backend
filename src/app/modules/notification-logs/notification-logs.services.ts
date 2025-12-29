import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { notificationLogs } from "../../../db/schema";
import { getEmailTemplate } from "../../utils/email-template";
import { NotificationRecipients, NotificationType } from "./notification-logs.interfaces";
import { buildNotificationData, getRecipientsForNotification, sendEmailWithLogging } from "./notification-logs.utils";

const sendNotification = async (
    platformId: string,
    notificationType: NotificationType,
    order: any,
    overrideRecipients?: Partial<NotificationRecipients>
) => {
    const recipients =
        overrideRecipients ||
        (await getRecipientsForNotification(notificationType, order));

    // Build notification data
    const data = await buildNotificationData(order);

    // Get email template
    const { subject, html } = await getEmailTemplate(notificationType, data)

    // Create notification log entry (QUEUED status)
    const [logEntry] = await db
        .insert(notificationLogs)
        .values({
            platform_id: platformId,
            order_id: order.id,
            notification_type: notificationType,
            recipients: JSON.stringify(recipients),
            status: 'QUEUED',
            attempts: 1,
        })
        .returning()

    // Send email
    if (!recipients.to) {
        console.log(
            `   ✖ No recipients found for notification type: ${notificationType}`
        )
        return
    }

    for (const toEmail of recipients.to) {
        await sendEmailWithLogging(
            toEmail,
            subject,
            html
        )
    }

    await db
        .update(notificationLogs)
        .set({
            status: 'SENT',
            sent_at: new Date(),
        })
        .where(eq(notificationLogs.id, logEntry.id))

    if (recipients.cc && recipients.cc.length > 0) {
        for (const ccEmail of recipients.cc) {
            const ccMessageId = await sendEmailWithLogging(
                ccEmail,
                subject,
                html
            )
            console.log(
                `   ✓ CC sent to: ${ccEmail} (Message ID: ${ccMessageId})`
            )
        }
    }

    console.log(
        `✅ Notification sent: ${notificationType} for order ${order.orderId} (Total: ${recipients.to.length} primary, ${recipients.cc?.length || 0} CC)`
    )
};

export const NotificationLogServices = {
    sendNotification
}