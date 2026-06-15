interface ProgressBarsProps {
  activeIndex: number;
  total: number;
}

export function ProgressBars({ activeIndex, total }: ProgressBarsProps) {
  return (
    <div className="pbars" aria-label={`${total}장 중 ${activeIndex + 1}장`}>
      {Array.from({ length: total }, (_, index) => (
        <i
          key={index}
          className={index < activeIndex ? "done" : index === activeIndex ? "cur" : ""}
        >
          <b />
        </i>
      ))}
    </div>
  );
}
