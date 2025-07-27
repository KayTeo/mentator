import 'katex/dist/katex.min.css';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { processString } from './stringProcessing';

interface LatexInputFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const LatexInputField: React.FC<LatexInputFieldProps> = ({
  value,
  onChange,
  ...props
}) => {
  const [processedValue, setProcessedValue] = useState<string>('');
  const renderedLatexRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Process the string and wrap it in markdown math delimiters
    const processed = processString(value);
    setProcessedValue(processed);
  }, [value]);

  useEffect(() => {
    if (renderedLatexRef.current) {
      renderedLatexRef.current.scrollLeft = renderedLatexRef.current.scrollWidth;
    }
  }, [processedValue]);

  return (
    <div className="flex-1 flex flex-col overflow-x-auto">
      <textarea
        value={value}
        onChange={onChange}
        {...props}
      />
      <div
        ref={renderedLatexRef}
        className="mt-2 p-2 bg-gray-50 border rounded min-h-[2em] overflow-x-auto"
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[
            [rehypeKatex, {
              strict: false, // Disable strict mode to allow Unicode characters
              trust: true, // Allow more permissive parsing
              throwOnError: false, // Don't throw on errors
            }]
          ]}
        >
          {processedValue}
        </ReactMarkdown>
      </div>
    </div>
  );
};
