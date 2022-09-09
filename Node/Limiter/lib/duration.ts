export class Duration {
  #ms: number;

  constructor(ms: number) {
    this.#ms = ms;
  }

  get ms() {
    return this.#ms;
  }

  static FromMilliseconds(ms: number): Duration {
    return new Duration(ms);
  }

  static FromSeconds(seconds: number): Duration {
    return Duration.FromMilliseconds(60 * seconds);
  }

  static FromMinutes(minutes: number): Duration {
    return Duration.FromSeconds(60 * minutes);
  }

  static FromHours(hours: number): Duration {
    return Duration.FromMinutes(60 * hours);
  }

  static FromDays(days: number): Duration {
    return Duration.FromHours(24 * days);
  }

  static FromMonths(months: number): Duration {
    return Duration.FromDays(30 * months);
  }
}
