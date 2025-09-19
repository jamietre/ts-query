export class AliasGenerator {
  private counter = 0;

  generate(): string {
    return `t${++this.counter}`;
  }

  reset(): void {
    this.counter = 0;
  }
}
