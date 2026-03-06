import { Star } from "lucide-react";

interface Props {
  review: any;
}

export default function ReviewCard({ review }: Props) {
  const date = new Date(review.createdAt).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="border rounded-xl p-4 bg-white hover:bg-muted/20 transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm">{review.branchName}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: review.rating }).map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-yellow-400 text-yellow-400"
            />
          ))}
        </div>
      </div>

      <div className="text-sm text-muted-foreground leading-relaxed mt-2">
        {review.comment ? (
          review.comment
        ) : (
          <span className="italic text-muted-foreground/70">
            No se agregó comentario.
          </span>
        )}
      </div>

      {review.staff && review.staff.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.staff.map((staff: any) => (
            <span
              key={staff.id}
              className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
            >
              {staff.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}