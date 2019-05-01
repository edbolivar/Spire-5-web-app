export async function asyncForEach(array: any[], fn: (item: any, idx: number, array: any[]) => Promise<void>) {
  for (let index = 0; index < array.length; index++) {
    await fn(array[index], index, array);
  }
}
