"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProductReview } from "@/types";
import StarRating from "./StarRating";
import { User, Send, Star } from "lucide-react";

interface ProductReviewsProps {
  productId: string;
  reviews: ProductReview[];
  onReviewAdded: (review: ProductReview) => void;
}

export default function ProductReviews({
  productId,
  reviews,
  onReviewAdded,
}: ProductReviewsProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(t("reviews.name_required") || "Please enter your name");
      return;
    }
    if (rating === 0) {
      setError(t("reviews.rating_required") || "Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          reviewer_name: name.trim(),
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }

      const newReview = await res.json();
      onReviewAdded(newReview);
      setName("");
      setRating(0);
      setComment("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Average */}
        <div className="flex flex-col items-center min-w-[120px]">
          <span className="text-4xl font-black text-gray-900">
            {avgRating.toFixed(1)}
          </span>
          <StarRating rating={avgRating} size={18} />
          <span className="text-xs text-gray-400 mt-1">
            {reviews.length} {t("reviews.reviews_count") || "reviews"}
          </span>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-1.5 w-full">
          {ratingCounts.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-3 text-gray-500 font-medium text-right">
                {star}
              </span>
              <Star
                size={12}
                className="text-amber-400 shrink-0"
                fill="currentColor"
                strokeWidth={0}
              />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{
                    width:
                      reviews.length > 0
                        ? `${(count / reviews.length) * 100}%`
                        : "0%",
                  }}
                />
              </div>
              <span className="w-6 text-xs text-gray-400 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Form */}
      <form
        onSubmit={handleSubmit}
        data-testid="reviews-form"
        className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100"
      >
        <h4 className="font-bold text-sm text-gray-800">
          {t("reviews.write_review") || "Write a Review"}
        </h4>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            data-testid="reviews-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("reviews.your_name") || "Your name"}
            maxLength={100}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] bg-white"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {t("reviews.your_rating") || "Rating"}:
            </span>
            <StarRating
              rating={rating}
              size={22}
              interactive
              onRate={setRating}
              testIdPrefix="reviews-star-button"
            />
          </div>
        </div>

        <textarea
          data-testid="reviews-comment-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            t("reviews.comment_placeholder") ||
            "Share your thoughts about this product... (optional)"
          }
          maxLength={1000}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] bg-white resize-none"
        />

        {error && <p data-testid="reviews-error-message" className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          data-testid="reviews-submit-button"
          disabled={submitting}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] text-white text-sm font-bold rounded-xl hover:bg-[#005bb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          {submitting
            ? t("reviews.submitting") || "Submitting..."
            : t("reviews.submit") || "Submit Review"}
        </button>
      </form>

      {/* Review List */}
      {reviews.length > 0 ? (
        <div data-testid="reviews-list" className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              data-testid={`review-item-${review.id}`}
              className="flex gap-3 pb-4 border-b border-gray-100 last:border-0"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                <User size={16} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-800">
                    {review.reviewer_name}
                  </span>
                  <StarRating rating={review.rating} size={13} />
                </div>
                <span className="text-[11px] text-gray-400">
                  {new Date(review.created_at).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
                {review.comment && (
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p data-testid="reviews-empty-state" className="text-sm text-gray-400 text-center py-4">
          {t("reviews.no_reviews") || "No reviews yet. Be the first to review!"}
        </p>
      )}
    </div>
  );
}
