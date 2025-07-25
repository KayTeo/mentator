import 'katex/dist/katex.min.css';
import React, { useState, useEffect } from 'react';
import katex from 'katex';

interface LatexInputFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const LatexInputField: React.FC<LatexInputFieldProps> = ({
  value,
  onChange,
  ...props
}) => {
  const [latexError, setLatexError] = useState<string | null>(null);
  const [renderedLatex, setRenderedLatex] = useState<string>('');

  useEffect(() => {
    try {
      value = value.replace(/ /g, '\\ ');
      setRenderedLatex(
        katex.renderToString(value, {
          throwOnError: false,
          displayMode: true,
        })
      );
      setLatexError(null);
    } catch (err: any) {
      setLatexError(err.message);
      setRenderedLatex('');
    }
  }, [value]);

  return (
    <div className="flex-1 flex flex-col">
      <textarea
        value={value}
        onChange={onChange}
        {...props}
      />
      <div className="mt-2 p-2 bg-gray-50 border rounded min-h-[2em]">
        {latexError ? (
          <span className="text-red-500">{latexError}</span>
        ) : (
          <span
            dangerouslySetInnerHTML={{ __html: renderedLatex }}
          />
        )}
      </div>
    </div>
  );
};
