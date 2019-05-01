const startTime = new Date().getTime();

export function getTimer() {
  return new Date().getTime() - startTime;
}
