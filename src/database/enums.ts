/**
 * The unban_mode for a guild.
 */
export const UnbanMode = {
  /**
   * Automatically unban the user on this server when they are unbanned on another server
   */
  AUTO: "AUTO",
  /**
   * Require manual review before unbanning the user on this server
   */
  REVIEW: "REVIEW",
} as const;
