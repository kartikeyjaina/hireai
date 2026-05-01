function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </div>
        ) : null}
        <h1>{title}</h1>
        {description ? <p className="mt-3 max-w-3xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export default SectionHeader;
