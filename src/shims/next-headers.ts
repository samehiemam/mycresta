// Static build has no request headers. Provided only so any transitive
// `next/headers` import resolves; kept pages/components do not call it.
export async function headers() {
  return new Headers();
}

export async function cookies() {
  return {
    get: () => undefined,
    getAll: () => [] as unknown[],
    has: () => false,
  };
}
