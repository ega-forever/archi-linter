export default class SummaryStat {
  errors = 0;

  warnings = 0;

  incrementStat(logLevel: number) {
    if (logLevel === 1) {
      this.warnings++;
    }

    if (logLevel === 2) {
      this.errors++;
    }
  }
}
