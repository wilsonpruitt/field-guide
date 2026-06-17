// Schedule items that link to another section of the guide go to that explainer.
// Items that DON'T link still need context for newcomers — this wraps such an
// item's title in a hover/focus popover carrying its category + a plain-language
// note (item-specific if authored, otherwise a default for its type). Pure CSS,
// no JS — mirrors the BodRefs popover pattern. Keyboard-accessible via tabIndex.
export default function ScheduleNote({
  title,
  category,
  body,
}: {
  title: string;
  category: string;
  body: string;
}) {
  return (
    <span className="sched-info" tabIndex={0}>
      {title}
      <span className="sched-info-pop" role="tooltip">
        <span className="si-cat">{category}</span>
        <span className="si-body">{body}</span>
      </span>
    </span>
  );
}
