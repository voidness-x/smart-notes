"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Star, Send, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createReviewAction,
  replyToReviewAction,
  deleteReviewAction,
} from "@/actions/reviews";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

type User = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
} | null;

type Review = {
  id: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  replies: ReviewReply[];
};

type ReviewReply = {
  id: string;
  reviewId: string;
  userId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: User;
};

type Props = {
  reviews: Review[];
  userReview: Review | null;
  user: User;
};

function ReviewPageClient({ reviews: initialReviews, userReview: initialUserReview, user }: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [userReview, setUserReview] = useState<Review | null>(initialUserReview);
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(userReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [deletingReview, setDeletingReview] = useState<string | null>(null);
  
  const isSupervisor = user?.role === "supervisor" || user?.role === "admin";

  // Sync state with props when they change (after router.refresh())
  useEffect(() => {
    setReviews(initialReviews);
    setUserReview(initialUserReview);
    if (initialUserReview) {
      setRating(initialUserReview.rating);
      setComment(initialUserReview.comment || "");
    }
  }, [initialReviews, initialUserReview]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Error", { description: "Please select a rating" });
      return;
    }

    if (!user) {
      toast.error("Error", { description: "Please log in to leave a review" });
      router.push("/login");
      return;
    }

    setSubmitting(true);
    const result = await createReviewAction(rating, comment.trim() || undefined);

    setSubmitting(false);

    if (result.errorMessage) {
      toast.error("Error", { description: result.errorMessage });
    } else {
      toast.success("Success", { description: userReview ? "Review updated!" : "Thank you for your review!" });
      // Refresh page to get updated reviews
      setTimeout(() => {
        router.refresh();
      }, 500);
    }
  };

  const handleReply = async (reviewId: string) => {
    const text = replyText[reviewId]?.trim();
    if (!text) {
      toast.error("Error", { description: "Please enter a reply" });
      return;
    }

    if (!user) {
      toast.error("Error", { description: "Please log in to reply" });
      router.push("/login");
      return;
    }

    setReplyingTo(reviewId);
    const result = await replyToReviewAction(reviewId, text);

    setReplyingTo(null);

    if (result.errorMessage) {
      toast.error("Error", { description: result.errorMessage });
    } else {
      toast.success("Success", { description: "Reply posted!" });
      setReplyText((prev) => ({ ...prev, [reviewId]: "" }));
      // Refresh page to get updated reviews with replies
      setTimeout(() => {
        router.refresh();
      }, 500);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setDeletingReview(reviewId);
    const result = await deleteReviewAction(reviewId);
    setDeletingReview(null);

    if (result.errorMessage) {
      toast.error("Error", { description: result.errorMessage });
    } else {
      toast.success("Success", { description: "Review deleted" });
      // Remove review from local state
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      // Refresh page to get updated reviews
      setTimeout(() => {
        router.refresh();
      }, 500);
    }
  };

  const getInitials = (email: string) => {
    const parts = email.split("@")[0];
    if (parts.length >= 2) {
      return parts.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 1).toUpperCase();
  };

  const displayName = (user: User) => {
    return user?.name || user?.email.split("@")[0] || "Anonymous";
  };

  // Format date consistently to prevent hydration mismatch
  // Use manual formatting to avoid locale/timezone differences
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}, ${year}`;
  };

  // Format short date for replies
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full max-w-4xl mx-auto px-4 py-8">
      {/* Logo and Welcome Text */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <Image
          src="/Smart Notes.png"
          height={120}
          width={120}
          alt="Smart Notes Logo"
          className="rounded-full"
          priority
        />
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">We Value Your Feedback</h1>
          <p className="text-muted-foreground max-w-2xl">
            Your thoughts and experiences help us improve Smart Notes. We take pride in your reviews
            and use them to make our platform better for everyone.
          </p>
        </div>
      </div>

      {/* Review Form */}
      {user && (
        <div className="w-full border rounded-lg p-6 mb-8 bg-card">
          <h2 className="text-xl font-semibold mb-4">
            {userReview ? "Update Your Review" : "Leave a Review"}
          </h2>
          
          {/* Star Rating */}
          <div className="mb-4">
            <Label>Rating</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="mt-2 min-h-[100px]"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmitReview}
            disabled={submitting || rating === 0}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {userReview ? "Updating..." : "Submitting..."}
              </>
            ) : (
              <>
                <Star className="mr-2 h-4 w-4" />
                {userReview ? "Update Review" : "Submit Review"}
              </>
            )}
          </Button>
        </div>
      )}

      {!user && (
        <div className="w-full border rounded-lg p-6 mb-8 bg-card text-center">
          <p className="text-muted-foreground mb-4">
            Please log in to leave a review
          </p>
          <Button onClick={() => router.push("/login")}>
            Log In
          </Button>
        </div>
      )}

      {/* Reviews List */}
      <div className="w-full space-y-6">
        <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
        
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No reviews yet. Be the first to leave one!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="border rounded-lg p-6 bg-card space-y-4"
            >
              {/* Review Header */}
              <div className="flex items-start gap-4">
                {/* Avatar */}
                {review.user?.avatarUrl ? (
                  <img
                    src={review.user.avatarUrl}
                    alt={displayName(review.user)}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {getInitials(review.user?.email || "A")}
                  </div>
                )}

                {/* Review Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {displayName(review.user)}
                      </h3>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Delete button for supervisors */}
                    {isSupervisor && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            disabled={deletingReview === review.id}
                          >
                            {deletingReview === review.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Review</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this review? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteReview(review.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>

              {/* Review Comment */}
              {review.comment && (
                <p className="text-foreground whitespace-pre-wrap">{review.comment}</p>
              )}

              {/* Reply Section */}
              <div className="space-y-3">
                {/* Reply Input */}
                {user && (
                  <div className="flex gap-2">
                    <Input
                      value={replyText[review.id] || ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))
                      }
                      placeholder="Write a reply..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          handleReply(review.id);
                        }
                      }}
                    />
                    <Button
                      onClick={() => handleReply(review.id)}
                      disabled={replyingTo === review.id || !replyText[review.id]?.trim()}
                      size="icon"
                    >
                      {replyingTo === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}

                {/* Existing Replies */}
                {review.replies && review.replies.length > 0 && (
                  <div className="space-y-3 ml-4 pl-4 border-l-2 border-muted">
                    {review.replies.map((reply) => (
                      <div key={reply.id} className="space-y-2">
                        <div className="flex items-start gap-3">
                          {reply.user?.avatarUrl ? (
                            <img
                              src={reply.user.avatarUrl}
                              alt={displayName(reply.user)}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                              {getInitials(reply.user?.email || "A")}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">
                                {displayName(reply.user)}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {formatShortDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {reply.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Return to Notes Button */}
      <div className="flex justify-center pt-4 sm:pt-6 mt-6 sm:mt-8">
        <Button
          variant="outline"
          onClick={() => router.push("/notes")}
          size="sm"
          className="text-sm sm:text-base"
        >
          Return to Notes
        </Button>
      </div>
    </div>
  );
}

export default ReviewPageClient;

