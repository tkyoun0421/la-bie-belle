type EmptyRowProps = {
  message: string;
};

export function EmptyRow({ message }: EmptyRowProps) {
  return (
    <div className="flex items-center py-3">
      <p className="typo-body text-text">{message}</p>
    </div>
  );
}
