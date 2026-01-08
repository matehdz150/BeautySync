export function StepReview({ name, email, role, startTime, endTime }: any) {
  return (
    <div className="space-y-2 text-sm">
      <p><b>Name:</b> {name}</p>
      <p><b>Email:</b> {email}</p>
      <p><b>Role:</b> {role}</p>
      <p><b>Schedule:</b> {startTime} — {endTime}</p>
    </div>
  );
}