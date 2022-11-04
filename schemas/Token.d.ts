export type Token = {
  /**
   * ID of the user that owns the token
   */
  userId: string;

  /**
   * Token expiration date
   */
  expiresAt: string;

  /**
   * Token creation date
   * @default new Date().toISOString()
   * @example 2021-01-01T00:00:00.000Z
   * @format date-time
   * @type string
   * @pattern ^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$
   */
  createdAt: string;
};
