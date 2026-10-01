export const BADGE_THRESHOLDS = [
  { level: "Bronze", points: 0 },
  { level: "Silver", points: 100 },
  { level: "Gold", points: 300 },
  { level: "Master", points: 700 },
] as const;

export type BadgeLevel = (typeof BADGE_THRESHOLDS)[number]["level"];

export function getBadgeLevel(points: number): BadgeLevel {
  return [...BADGE_THRESHOLDS]
    .reverse()
    .find((badge) => points >= badge.points)?.level ?? "Bronze";
}

export function getBadgeProgress(points: number) {
  const currentBadge = [...BADGE_THRESHOLDS]
    .reverse()
    .find((badge) => points >= badge.points) ?? BADGE_THRESHOLDS[0];
  const nextBadge = BADGE_THRESHOLDS.find((badge) => points < badge.points);

  return {
    nextLevel: nextBadge?.level ?? null,
    pointsRemaining: nextBadge ? nextBadge.points - points : 0,
    percentage: nextBadge
      ? Math.round(
          ((points - currentBadge.points) /
            (nextBadge.points - currentBadge.points)) *
            100,
        )
      : 100,
  };
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}