import { getUser } from "@/auth/server";
import { getReviewsAction, getUserReviewAction } from "@/actions/reviews";
import ReviewPageClient from "@/components/ui/ReviewPageClient";
import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";

async function ReviewsPage() {
  const user = await getUser();

  // Check if user is blocked
  if (user) {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { blocked: true },
    });

    if (userData?.blocked) {
      redirect("/blocked");
    }
  }

  // Get all reviews
  const reviewsResult = await getReviewsAction();
  const reviews = reviewsResult.reviews || [];

  // Get user's review if logged in
  let userReview = null;
  let userProfile = null;
  if (user) {
    const reviewResult = await getUserReviewAction();
    userReview = reviewResult.review || null;

    // Get user profile
    let profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
      },
    });

    // If user doesn't exist in database but is authenticated, create them
    if (!profile && user.email) {
      try {
        profile = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        });
      } catch (error: any) {
        // If user was created by another request (race condition), fetch it
        if (error?.code === 'P2002') {
          profile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              role: true,
            },
          });
        }
      }
    }
    userProfile = profile;
  }

  // Dates are already serialized by the server actions, so we can use them directly
  const serializedReviews = reviews;
  const serializedUserReview = userReview;

  return (
    <ReviewPageClient
      reviews={serializedReviews as any}
      userReview={serializedUserReview as any}
      user={userProfile}
    />
  );
}

export default ReviewsPage;

