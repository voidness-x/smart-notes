import { getUser } from "@/auth/server";
import { getReviewsAction, getUserReviewAction } from "@/actions/reviews";
import ReviewPageClient from "@/components/ui/ReviewPageClient";
import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";

async function ReviewsPage() {
  const user = await getUser();

  // Parallelize all queries for better performance
  const [userData, reviewsResult, reviewResult, profile] = await Promise.all([
    // Check if user is blocked
    user ? prisma.user.findUnique({
      where: { id: user.id },
      select: { blocked: true },
    }) : Promise.resolve(null),
    
    // Get all reviews
    getReviewsAction(),
    
    // Get user's review if logged in
    user ? getUserReviewAction() : Promise.resolve({ errorMessage: null, review: null }),
    
    // Get user profile
    user ? prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
      },
    }) : Promise.resolve(null),
  ]);

  // Check if user is blocked
  if (userData?.blocked) {
    redirect("/blocked");
  }

  const reviews = reviewsResult.reviews || [];
  let userReview = reviewResult.review || null;
  let userProfile = profile;

  // If user doesn't exist in database but is authenticated, create them
  if (user && !userProfile && user.email) {
    try {
      userProfile = await prisma.user.create({
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
        userProfile = await prisma.user.findUnique({
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

