'use client';

export default function GreetButton() {
  const handleClick = () => {
    // TODO: Implement greeting logic
    alert('Hello there!');
  };

  return (
    <button
      onClick={handleClick}
      className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium"
    >
      Greet
    </button>
  );
}

