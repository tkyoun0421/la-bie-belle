export function groupBy<Item, Key>(
  items: readonly Item[],
  keyOf: (item: Item) => Key,
): Map<Key, Item[]> {
  return items.reduce<Map<Key, Item[]>>((grouped, item) => {
    const key = keyOf(item);

    return grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }, new Map());
}

export function countBy<Item, Key>(
  items: readonly Item[],
  keyOf: (item: Item) => Key,
): Map<Key, number> {
  return items.reduce<Map<Key, number>>((counted, item) => {
    const key = keyOf(item);

    return counted.set(key, (counted.get(key) ?? 0) + 1);
  }, new Map());
}
