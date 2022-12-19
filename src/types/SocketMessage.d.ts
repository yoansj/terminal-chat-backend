export interface SocketMessage {
  user: string;
  message: string;
  private: boolean;
  to: string;
}
