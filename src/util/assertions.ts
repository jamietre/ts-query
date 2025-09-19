export type AssertionError = Error | string | (() => never);

function throwAssertionError(error: AssertionError): never {
  if (typeof error === "function") {
    throw error();
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(error);
}

export function assertNever(value: never, error?: AssertionError): asserts value is never {
  throwAssertionError(error ?? `Value ${value} should never occur in this context`);
}
