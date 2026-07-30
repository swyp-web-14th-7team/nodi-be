export const NotificationType = {
  CONNECTION_ACCEPTED: 1,
  CONNECTION_REJECTED: 2,
  CONNECTION_REQUESTED: 3,
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

export type ConnectionRequestedPayload = {
  requestId: string;
  counterpartCardId: string; // 요청 대상 카드 ID
  counterpartName: string; // 요청 대상 닉네임
  receiverCardId: string; // 요청 시 선택한 내 카드 ID
};

export type CreateNotificationInput =
  | {
      type: typeof NotificationType.CONNECTION_ACCEPTED;
      payload: ConnectionAcceptedPayload;
    }
  | {
      type: typeof NotificationType.CONNECTION_REJECTED;
      payload: ConnectionRejectedPayload;
    }
  | {
      type: typeof NotificationType.CONNECTION_REQUESTED;
      payload: ConnectionRequestedPayload;
    };

export type NotificationPayload =
  | ConnectionAcceptedPayload
  | ConnectionRejectedPayload
  | ConnectionRequestedPayload;
