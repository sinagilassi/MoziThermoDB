type TimeItOptions = {
  label?: string;
  log?: (message: string, durationMs: number) => void;
  storeOnInstanceKey?: string;
  enabledKey?: string;
};

const defaultLogger = (message: string) => {
  console.log(message);
};

const nowMs = () => {
  const perf =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance
      : null;
  return perf ? perf.now() : Date.now();
};

/**
 * Decorator to measure execution time of a method.
 *
 * Usage:
 * ```ts
 * class Example {
 *   @timeIt({ label: "equation.calc" })
 *   calc(...) { ... }
 * }
 * ```
 */
export function timeIt(options: TimeItOptions = {}): MethodDecorator {
  const { label, log = defaultLogger, storeOnInstanceKey, enabledKey } = options;

  return (
    _target,
    propertyKey,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    const original = descriptor.value;

    if (typeof original !== "function") {
      throw new Error("@timeIt can only decorate methods.");
    }

    descriptor.value = function (...args: unknown[]) {
      if (
        enabledKey &&
        this &&
        typeof this === "object" &&
        (this as Record<string, unknown>)[enabledKey] === false
      ) {
        return original.apply(this, args);
      }

      const start = nowMs();
      const result = original.apply(this, args);

      const finish = (end: number) => {
        const durationMs = end - start;
        const name =
          label ?? (typeof propertyKey === "string" ? propertyKey : "method");
        log(`[timeIt] ${name}: ${durationMs.toFixed(3)} ms`, durationMs);
        if (storeOnInstanceKey && this && typeof this === "object") {
          (this as Record<string, number>)[storeOnInstanceKey] = durationMs;
        }
      };

      if (result && typeof (result as Promise<unknown>).then === "function") {
        return (result as Promise<unknown>).finally(() => finish(nowMs()));
      }

      finish(nowMs());
      return result;
    };

    return descriptor;
  };
}
