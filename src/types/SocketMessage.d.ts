export interface SocketMessage {
  user: string;
  message: string;
  to: string;
  privateMessage?: boolean;
  customSender?: string;
}
