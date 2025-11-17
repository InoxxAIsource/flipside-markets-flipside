import { rewardsService } from './rewardsService';

/**
 * RewardsCronService - Manages scheduled tasks for rewards system
 * 
 * Runs:
 * - Hourly: Recalculate all user points from order fills
 * - Weekly: Reset weekly points (Sunday midnight)
 */
export class RewardsCronService {
  private recalculationInterval: NodeJS.Timeout | null = null;
  private weeklyResetInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * Start the cron service
   */
  start() {
    if (this.isRunning) {
      console.log('[RewardsCron] Already running');
      return;
    }

    console.log('[RewardsCron] Starting rewards cron service...');
    
    // Run initial recalculation
    this.runRecalculation();

    // Schedule hourly recalculation (every hour)
    this.recalculationInterval = setInterval(() => {
      this.runRecalculation();
    }, 60 * 60 * 1000); // 1 hour

    // Schedule weekly reset (check every hour, reset on Sunday midnight)
    this.weeklyResetInterval = setInterval(() => {
      this.checkWeeklyReset();
    }, 60 * 60 * 1000); // 1 hour

    this.isRunning = true;
    console.log('[RewardsCron] Cron service started successfully');
    console.log('[RewardsCron] - Points recalculation: Every hour');
    console.log('[RewardsCron] - Weekly reset: Sunday 00:00 UTC');
  }

  /**
   * Stop the cron service
   */
  stop() {
    if (this.recalculationInterval) {
      clearInterval(this.recalculationInterval);
      this.recalculationInterval = null;
    }

    if (this.weeklyResetInterval) {
      clearInterval(this.weeklyResetInterval);
      this.weeklyResetInterval = null;
    }

    this.isRunning = false;
    console.log('[RewardsCron] Cron service stopped');
  }

  /**
   * Run points recalculation
   */
  private async runRecalculation() {
    try {
      const startTime = Date.now();
      console.log('[RewardsCron] Starting hourly points recalculation...');
      
      await rewardsService.recalculateAllPoints();
      
      const duration = Date.now() - startTime;
      console.log(`[RewardsCron] Points recalculation completed in ${duration}ms`);
    } catch (error) {
      console.error('[RewardsCron] Error during points recalculation:', error);
    }
  }

  /**
   * Check if it's time for weekly reset (Sunday 00:00 UTC)
   */
  private async checkWeeklyReset() {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday
    const hour = now.getUTCHours();

    // Reset on Sunday at midnight UTC (with 1 hour window)
    if (dayOfWeek === 0 && hour === 0) {
      try {
        console.log('[RewardsCron] Starting weekly points reset...');
        await rewardsService.resetWeeklyPoints();
        console.log('[RewardsCron] Weekly points reset completed');
      } catch (error) {
        console.error('[RewardsCron] Error during weekly reset:', error);
      }
    }
  }

  /**
   * Manually trigger recalculation (for testing/admin)
   */
  async triggerRecalculation() {
    console.log('[RewardsCron] Manual recalculation triggered');
    await this.runRecalculation();
  }

  /**
   * Get cron service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasRecalculationInterval: this.recalculationInterval !== null,
      hasWeeklyResetInterval: this.weeklyResetInterval !== null,
    };
  }
}

// Singleton instance
export const rewardsCron = new RewardsCronService();
