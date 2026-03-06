import ReviewCard from "./ReviewCard";

interface Props {
  reviews: any[];
}

export default function ReviewsSection({ reviews }: Props) {
  if (!reviews || reviews.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-4">Reseñas</h2>
        <p className="text-sm text-muted-foreground">
          Este cliente aún no tiene reseñas.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Reseñas</h2>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}