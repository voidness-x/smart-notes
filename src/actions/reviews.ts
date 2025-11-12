"use server";

import { handleError } from "@/lib/utils";
import { prisma } from "@/db/prisma";
import { ratingSchema, commentSchema } from "@/lib/validation";
import { sanitizeHTML } from "@/lib/security";
import { requireAuth, requireRole, validate, serializeDates, serializeDatesArray } from "@/lib/helpers";
import { getUser } from "@/auth/server";

const userSelect = { id: true, email: true, name: true, avatarUrl: true };

export const createReviewAction = async (rating: number, comment?: string) => {
  try {
    const user = await requireAuth();
    const validRating = validate(ratingSchema, rating);
    const validComment = comment ? sanitizeHTML(validate(commentSchema, comment)) : null;

    const existingReview = await prisma.review.findFirst({
      where: { userId: user.id },
    });

    const review = existingReview
      ? await prisma.review.update({
          where: { id: existingReview.id },
          data: { rating: validRating, comment: validComment },
          include: { user: { select: userSelect } },
        })
      : await prisma.review.create({
          data: { userId: user.id, rating: validRating, comment: validComment },
          include: { user: { select: userSelect } },
        });

    return { errorMessage: null, review: serializeDates(review) };
  } catch (error) {
    return { ...handleError(error), review: null };
  }
};

export const getReviewsAction = async () => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: userSelect },
        replies: {
          include: { user: { select: userSelect } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const serialized = reviews.map(review => ({
      ...serializeDates(review),
      replies: serializeDatesArray(review.replies),
    }));

    return { errorMessage: null, reviews: serialized };
  } catch (error) {
    return { ...handleError(error), reviews: [] };
  }
};

export const getUserReviewAction = async () => {
  try {
    const user = await getUser();
    if (!user) return { errorMessage: null, review: null };

    const review = await prisma.review.findFirst({
      where: { userId: user.id },
      include: { user: { select: userSelect } },
    });

    return { errorMessage: null, review: review ? serializeDates(review) : null };
  } catch (error) {
    return { ...handleError(error), review: null };
  }
};

export const replyToReviewAction = async (reviewId: string, comment: string) => {
  try {
    const user = await requireAuth();
    const sanitizedComment = sanitizeHTML(validate(commentSchema, comment));
    
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error("Review not found");

    const reply = await prisma.reviewReply.create({
      data: { reviewId, userId: user.id, comment: sanitizedComment },
      include: { user: { select: userSelect } },
    });

    return { errorMessage: null, reply: serializeDates(reply) };
  } catch (error) {
    return { ...handleError(error), reply: null };
  }
};

export const deleteReviewAction = async (reviewId: string) => {
  try {
    // Only supervisors and admins can delete reviews
    await requireRole(["supervisor", "admin"]);
    
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error("Review not found");

    // Delete the review (cascade will delete replies)
    await prisma.review.delete({ where: { id: reviewId } });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

