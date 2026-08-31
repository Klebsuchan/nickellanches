export default function NickelText({ className = "" }: { className?: string }) {
  return (
    <span 
      className={`tracking-tighter leading-none inline-block ${className}`}
      style={{ 
        fontFamily: '"Russo One", sans-serif', 
        fontStyle: 'italic', 
        color: '#FFD700', 
        WebkitTextStroke: '0.04em black', 
        textShadow: '0.06em 0.06em 0px #000' 
      }}
    >
      Nickel
    </span>
  );
}
