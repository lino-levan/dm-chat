export function getInitials(str: string) {
  const split = str.split(" ").filter(Boolean);
  // If there's only one word, return the first two letters
  if (split.length === 1) {
    return str.slice(0, 2).toUpperCase();
  }
  // If there's more than one word, return the first letter of the first word and the first letter of the last word
  return split[0][0].toUpperCase() + split[split.length - 1][0].toUpperCase();
}
