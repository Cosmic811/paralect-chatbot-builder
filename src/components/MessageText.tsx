import { Fragment } from 'react';

/** Render the small inline subset the assistant uses, without accepting HTML. */
export function MessageText({ text }: { text: string }) {
  return text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-black/20 px-1 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
