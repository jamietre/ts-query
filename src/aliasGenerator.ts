export class AliasGenerator {
  private static counter = 0;

  static generate(): string {
    return `t${++this.counter}`;
  }

  static reset(): void {
    this.counter = 0;
  }
}

export class SubqueryAliasGenerator {
  private static counter = 0;

  static generate(): string {
    return `s${++this.counter}`;
  }

  static reset(): void {
    this.counter = 0;
  }
}