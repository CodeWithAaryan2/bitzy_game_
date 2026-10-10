/**
 * src/hooks/usePurchasedCourses.ts
 * Thin wrapper over trpc.payment.myCourses — AuthContext also exposes
 * hasPurchasedCourse()/refreshPurchasedCourses() backed by the same
 * query for components that just need a quick boolean check.
 */
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/context/AuthContext";

export function usePurchasedCourses() {
  const { isLoggedIn } = useAuth();
  const query = trpc.payment.myCourses.useQuery(undefined, { enabled: isLoggedIn });

  const purchasedCourseIds = new Set((query.data ?? []).map((row: any) => row.course_id as number));

  return {
    purchases: query.data ?? [],
    purchasedCourseIds,
    isLoading: query.isLoading,
    refresh: () => query.refetch(),
    hasPurchased: (courseId: number) => purchasedCourseIds.has(courseId),
  };
}
