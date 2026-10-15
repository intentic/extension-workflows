// A fake seam for this package's suites (only the tests import it, so the bundle never carries it). The monorepo's
// `@intentic/testing` helper, copied, since a standalone extension does not depend on an unpublished package.

// Keys the runtime calls unasked (`then` makes a value thenable, `toJSON` feeds JSON.stringify); left undefined.
const RESERVED = new Set([`then`, `toJSON`]);

// An unprovided member throws when called, naming the full path reached, and stays proxyable to any depth.
const namedThrow = (path: string): (() => never) =>
    new Proxy(
        () => {
            throw new Error(`${path} was called, and this test did not stub it`);
        },
        { get: (_target, key) => (typeof key === `symbol` || RESERVED.has(key) ? undefined : namedThrow(`${path}.${key}`)) },
    );

// Every unprovided member throws when called, named, so a wide seam needs no enumerated no-ops. A member read as data
// still needs providing, or it sees a function.
export const unstubbed = <T extends object>(seam: string, provided: NoInfer<Partial<T>>): T =>
    // SAFETY: the proxy answers every member of T, the provided ones as given and the rest as named throwing stubs.
    new Proxy(provided as T, {
        get: (target, key) =>
            key in target ? target[key as keyof T] : typeof key === `symbol` || RESERVED.has(key) ? undefined : namedThrow(`${seam}.${key}`),
    });
