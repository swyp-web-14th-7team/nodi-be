export const NotificationType = {
  CONNECTION_ACCEPTED: 1,
  CONNECTION_REJECTED: 2,
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export type ConnectionAcceptedPayload = {
  requestId: string;
  connectionId: string;
  counterpartCardId: string;
  counterpartName: string;
};

export type ConnectionRejectedPayload = {
  requestId: string;
  counterpartCardId: string;
  counterpartName: string;
};

export type CreateNotificationInput =
  | {
      type: typeof NotificationType.CONNECTION_ACCEPTED;
      payload: ConnectionAcceptedPayload;
    }
  | {
      type: typeof NotificationType.CONNECTION_REJECTED;
      payload: ConnectionRejectedPayload;
    };

export type NotificationPayload =
  | ConnectionAcceptedPayload
  | ConnectionRejectedPayload;
