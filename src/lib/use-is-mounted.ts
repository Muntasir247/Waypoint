import * as React from "react";

function emptySubscribe() {
  return () => {};
}

export function useIsMounted(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
